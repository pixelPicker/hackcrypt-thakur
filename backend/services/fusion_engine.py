import numpy as np
from utils.logger import logger

class FusionEngine:
    def __init__(self):
        self.weights = {
            "image": {
                "vision": 1.0,       # 100% - Primary signal for images
            },
            "audio": {
                "audio": 1.0,        # 100% - Primary signal for audio
            },
            "video": {
                # Video is multi-modal - balance all signals
                "lipsync": 0.30,     # ⭐ Voice-lip mismatch
                "vision": 0.25,      # Face swap artifacts
                "audio": 0.20,       # Voice deepfake in video
                "temporal": 0.20,    # Frame inconsistencies
                "metadata": 0.05     # Metadata forensics (only if available)
            }
        }
    
    def fuse(self, modality_scores: dict, media_type: str):
        try:
            weights = self.weights.get(media_type, {})
            
            weighted_scores = []
            total_weight = 0
            
            # Only include scores that exist and are not None
            for modality, score in modality_scores.items():
                if modality in weights and score is not None:
                    weighted_scores.append(score * weights[modality])
                    total_weight += weights[modality]
            
            # If no valid scores, return neutral
            if total_weight == 0:
                logger.warning(f"No valid detector scores for {media_type}")
                final_score = 0.5
            else:
                # Normalize by actual total weight (handles missing detectors)
                final_score = sum(weighted_scores) / total_weight
            
            if final_score > 0.6:
                label = "manipulated"
            elif final_score >= 0.4:
                label = "suspicious"
            else:
                label = "authentic"
            
            logger.info(f"Fusion result: {label} ({final_score:.2f}) for {media_type}")
            logger.info(f"Active detectors: {list(modality_scores.keys())}, Total weight: {total_weight:.2f}")
            
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
            
            if final_score > 0.6:
                label = "manipulated"
            elif final_score >= 0.4:
                label = "suspicious"
            else:
                label = "authentic"
            
            return final_score, label
        
        except Exception as e:
            logger.error(f"Adaptive fusion error: {str(e)}")
            return self.fuse(modality_scores, media_type)
