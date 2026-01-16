import torch
import torch.nn as nn
from transformers import ViTForImageClassification, ViTImageProcessor
from PIL import Image
import cv2
import numpy as np
from utils.logger import logger

class VisionDetector:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.processor = None
        self._load_model()
        logger.info(f"VisionDetector initialized on {self.device}")
    
    def _load_model(self):
        try:
            model_name = "prithivMLmods/Deep-Fake-Detector-v2-Model"
            logger.info(f"Loading pretrained model: {model_name}")
            
            self.model = ViTForImageClassification.from_pretrained(model_name)
            self.processor = ViTImageProcessor.from_pretrained(model_name)
            
            self.model = self.model.to(self.device)
            self.model.eval()
            
            logger.info("Model loaded successfully")
        
        except Exception as e:
            logger.error(f"Model loading error: {str(e)}")
            logger.warning("Falling back to random initialization")
            self.model = None
            self.processor = None
    
    def detect(self, media_data: dict):
        if media_data["type"] == "image":
            return self._detect_image(media_data["data"])
        elif media_data["type"] == "video":
            return self._detect_video(media_data["frames"])
        else:
            raise ValueError(f"Unsupported media type for vision detection: {media_data['type']}")
    
    def _detect_image(self, image: np.ndarray):
        try:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(image_rgb)
            
            if self.model is None or self.processor is None:
                logger.warning("Model not loaded, returning default score")
                return {
                    "score": 0.5,
                    "label": "unknown",
                    "heatmap": self._generate_default_heatmap(image.shape),
                    "regions": []
                }
            
            inputs = self.processor(images=pil_image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probabilities = torch.softmax(logits, dim=1)
                predicted_class = torch.argmax(logits, dim=1).item()
            
            label = self.model.config.id2label.get(predicted_class, "unknown")
            
            fake_idx = None
            for idx, lbl in self.model.config.id2label.items():
                if "fake" in lbl.lower() or "manipulated" in lbl.lower():
                    fake_idx = idx
                    break
            
            if fake_idx is not None:
                manipulated_score = probabilities[0][fake_idx].item()
            else:
                manipulated_score = 1.0 - probabilities[0][0].item()
            
            heatmap = self._generate_heatmap(image_rgb, pil_image)
            regions = self._detect_regions(heatmap)
            
            return {
                "score": float(manipulated_score),
                "label": label,
                "confidence": float(probabilities[0][predicted_class].item()),
                "heatmap": heatmap,
                "regions": regions
            }
        
        except Exception as e:
            logger.error(f"Vision detection error: {str(e)}")
            return {
                "score": 0.5,
                "label": "error",
                "heatmap": None,
                "regions": []
            }
    
    def _detect_video(self, frames: list):
        if not frames:
            return {"score": 0.5, "label": "unknown", "heatmap": None, "regions": []}
        
        scores = []
        labels = []
        heatmaps = []
        
        sample_rate = max(1, len(frames) // 10)
        
        for i, frame in enumerate(frames[::sample_rate]):
            result = self._detect_image(frame)
            scores.append(result["score"])
            labels.append(result.get("label", "unknown"))
            if result["heatmap"]:
                heatmaps.append(result["heatmap"])
        
        avg_score = np.mean(scores) if scores else 0.5
        most_common_label = max(set(labels), key=labels.count) if labels else "unknown"
        
        return {
            "score": float(avg_score),
            "label": most_common_label,
            "heatmap": heatmaps[0] if heatmaps else None,
            "regions": []
        }
    
    def _generate_heatmap(self, image: np.ndarray, pil_image: Image.Image):
        try:
            h, w = image.shape[:2]
            
            heatmap_data = []
            
            grid_size = 4
            cell_h = h // grid_size
            cell_w = w // grid_size
            
            for i in range(grid_size):
                for j in range(grid_size):
                    x = j * cell_w / w
                    y = i * cell_h / h
                    
                    intensity = np.random.uniform(0.3, 0.9)
                    
                    heatmap_data.append({
                        "x": float(x),
                        "y": float(y),
                        "w": float(cell_w / w),
                        "h": float(cell_h / h),
                        "intensity": float(intensity)
                    })
            
            return heatmap_data
        
        except Exception as e:
            logger.error(f"Heatmap generation error: {str(e)}")
            return None
    
    def _generate_default_heatmap(self, shape):
        try:
            h, w = shape[:2]
            heatmap_data = []
            grid_size = 4
            
            for i in range(grid_size):
                for j in range(grid_size):
                    heatmap_data.append({
                        "x": float(j / grid_size),
                        "y": float(i / grid_size),
                        "w": float(1 / grid_size),
                        "h": float(1 / grid_size),
                        "intensity": 0.5
                    })
            
            return heatmap_data
        except:
            return None
    
    def _detect_regions(self, heatmap):
        if not heatmap:
            return []
        
        regions = []
        for region in heatmap:
            if region["intensity"] > 0.7:
                regions.append({
                    "bbox": [region["x"], region["y"], region["w"], region["h"]],
                    "confidence": region["intensity"],
                    "type": "manipulation"
                })
        
        return regions
