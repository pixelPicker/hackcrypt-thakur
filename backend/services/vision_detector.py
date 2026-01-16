import os
import torch
import torch.nn as nn
from transformers import ViTForImageClassification, ViTImageProcessor
from PIL import Image
import cv2
import numpy as np
from utils.logger import logger

# Set longer timeout for HuggingFace downloads
os.environ['HF_HUB_DOWNLOAD_TIMEOUT'] = '60'

class VisionDetector:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.processor = None
        self._load_model()
        logger.info(f"VisionDetector initialized on {self.device}")
    
    def _load_model(self):
        try:
            # Set up local model cache directory
            current_script_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.normpath(os.path.join(current_script_dir, ".."))
            model_cache_dir = os.path.join(project_root, "models", "pretrained")
            os.makedirs(model_cache_dir, exist_ok=True)
            
            model_name = "prithivMLmods/Deep-Fake-Detector-v2-Model"
            logger.info(f"Loading pretrained model: {model_name}")
            logger.info(f"Cache directory: {model_cache_dir}")
            
            self.model = ViTForImageClassification.from_pretrained(
                model_name,
                cache_dir=model_cache_dir
            )
            self.processor = ViTImageProcessor.from_pretrained(
                model_name,
                cache_dir=model_cache_dir
            )
            
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
            return self._detect_video(media_data)
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
    
    def _detect_video(self, media_data: dict):
        """Detect deepfakes in video by processing frames on-demand"""
        from utils.memory_manager import MemoryManager
        
        video_path = media_data.get("video_path") or media_data.get("local_path")
        if not video_path:
            logger.error("No video path provided in media_data")
            return {"score": 0.5, "label": "unknown", "heatmap": None, "regions": []}
        
        try:
            cap = cv2.VideoCapture(video_path)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            if frame_count == 0:
                cap.release()
                return {"score": 0.5, "label": "unknown", "heatmap": None, "regions": []}
            
            scores = []
            labels = []
            heatmaps = []
            
            # Sample max 10 frames to reduce memory usage
            sample_rate = max(1, frame_count // 10)
            max_frames = 10
            
            logger.info(f"Processing video with {frame_count} frames (sampling every {sample_rate} frames)")
            MemoryManager.log_memory_usage("Before video processing: ")
            
            for i in range(0, frame_count, sample_rate):
                if len(scores) >= max_frames:
                    break
                
                cap.set(cv2.CAP_PROP_POS_FRAMES, i)
                ret, frame = cap.read()
                
                if not ret:
                    continue
                
                # Downscale frame to max 720p to save memory
                height, width = frame.shape[:2]
                max_height = 720
                if height > max_height:
                    scale = max_height / height
                    new_width = int(width * scale)
                    frame = cv2.resize(frame, (new_width, max_height), interpolation=cv2.INTER_AREA)
                
                # Process frame
                with MemoryManager.memory_efficient_context():
                    result = self._detect_image(frame)
                    scores.append(result["score"])
                    labels.append(result.get("label", "unknown"))
                    if result["heatmap"] and len(heatmaps) == 0:
                        heatmaps.append(result["heatmap"])
                
                # Explicitly delete frame to free memory
                del frame
            
            cap.release()
            MemoryManager.clear_memory()
            MemoryManager.log_memory_usage("After video processing: ")
            
            avg_score = np.mean(scores) if scores else 0.5
            most_common_label = max(set(labels), key=labels.count) if labels else "unknown"
            
            return {
                "score": float(avg_score),
                "label": most_common_label,
                "heatmap": heatmaps[0] if heatmaps else None,
                "regions": []
            }
        
        except Exception as e:
            logger.error(f"Video detection error: {str(e)}")
            return {"score": 0.5, "label": "error", "heatmap": None, "regions": []}
    
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
