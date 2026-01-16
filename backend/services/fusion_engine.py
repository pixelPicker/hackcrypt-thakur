import numpy as np
from utils.logger import logger

class FusionEngine:
    def __init__(self):
        self.weights = {
            "image": {"vision": 0.8, "metadata": 0.2},
            "audio": {"audio": 0.9, "metadata": 0.1},
            "video": {"vision": 0.4, "audio": 0.3, "temporal": 0.2, "metadata": 0.1}
        }
    
    def fuse(self, modality_scores: dict, media_type: str):
        try:
            weights = self.weights.get(media_type, {})
            
            weighted_scores = []
            total_weight = 0
            
            for modality, score in modality_scores.items():
                if modality in weights and score is not None:
                    weighted_scores.append(score * weights[modality])
                    total_weight += weights[modality]
            
            if total_weight == 0:
                final_score = 0.5
            else:
                final_score = sum(weighted_scores) / total_weight
            
            label = "manipulated" if final_score > 0.5 else "authentic"
            
            logger.info(f"Fusion result: {label} ({final_score:.2f}) for {media_type}")
            
            return final_score, label
        
        except Exception as e:
            logger.error(f"Fusion error: {str(e)}")
            return 0.5, "authentic"
    
    def adaptive_fusion(self, modality_scores: dict, media_type: str, confidence_levels: dict):
        try:
            adaptive_weights = {}
            
            base_weights = self.weights.get(media_type, {})
            
            total_confidence = sum(confidence_levels.values())
            
            for modality, base_weight in base_weights.items():
                if modality in confidence_levels:
                    confidence = confidence_levels[modality]
                    adaptive_weight = base_weight * (1 + confidence / total_confidence)
                    adaptive_weights[modality] = adaptive_weight
                else:
                    adaptive_weights[modality] = base_weight
            
            total_adaptive_weight = sum(adaptive_weights.values())
            normalized_weights = {k: v / total_adaptive_weight for k, v in adaptive_weights.items()}
            
            weighted_scores = []
            for modality, score in modality_scores.items():
                if modality in normalized_weights and score is not None:
                    weighted_scores.append(score * normalized_weights[modality])
            
            final_score = sum(weighted_scores) if weighted_scores else 0.5
            label = "manipulated" if final_score > 0.5 else "authentic"
            
            return final_score, label
        
        except Exception as e:
            logger.error(f"Adaptive fusion error: {str(e)}")
            return self.fuse(modality_scores, media_type)
