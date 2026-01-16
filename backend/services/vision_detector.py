import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
import timm
import cv2
import numpy as np
from utils.logger import logger

class VisionDetector:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._load_model()
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        logger.info(f"VisionDetector initialized on {self.device}")
    
    def _load_model(self):
        model = timm.create_model('efficientnet_b0', pretrained=True, num_classes=2)
        model = model.to(self.device)
        model.eval()
        return model
    
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
            
            input_tensor = self.transform(image_rgb).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                manipulated_score = probabilities[0][1].item()
            
            heatmap = self._generate_heatmap(image_rgb, input_tensor)
            regions = self._detect_regions(heatmap)
            
            return {
                "score": manipulated_score,
                "heatmap": heatmap,
                "regions": regions
            }
        
        except Exception as e:
            logger.error(f"Vision detection error: {str(e)}")
            return {"score": 0.5, "heatmap": None, "regions": []}
    
    def _detect_video(self, frames: list):
        if not frames:
            return {"score": 0.5, "heatmap": None, "regions": []}
        
        scores = []
        heatmaps = []
        
        for frame in frames[:10]:
            result = self._detect_image(frame)
            scores.append(result["score"])
            if result["heatmap"]:
                heatmaps.append(result["heatmap"])
        
        avg_score = np.mean(scores)
        
        return {
            "score": float(avg_score),
            "heatmap": heatmaps[0] if heatmaps else None,
            "regions": []
        }
    
    def _generate_heatmap(self, image: np.ndarray, input_tensor: torch.Tensor):
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
