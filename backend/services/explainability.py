import numpy as np
from utils.logger import logger

class ExplainabilityEngine:
    def __init__(self):
        pass
    
    def enhance(self, explainability_data: dict, modality_scores: dict, media_data: dict):
        try:
            enhanced = explainability_data.copy()
            
            if media_data["type"] in ["image", "video"] and not enhanced.get("heatmap"):
                enhanced["heatmap"] = self._generate_default_heatmap()
            
            if media_data["type"] == "video" and not enhanced.get("anomalies_timeline"):
                enhanced["anomalies_timeline"] = self._generate_default_timeline(
                    media_data.get("frame_count", 30),
                    media_data.get("fps", 30)
                )
            
            enhanced["modality_contributions"] = self._calculate_contributions(modality_scores)
            
            enhanced["key_indicators"] = self._identify_key_indicators(
                modality_scores,
                explainability_data
            )
            
            return enhanced
        
        except Exception as e:
            logger.error(f"Explainability enhancement error: {str(e)}")
            return explainability_data
    
    def _generate_default_heatmap(self):
        heatmap = []
        grid_size = 4
        
        for i in range(grid_size):
            for j in range(grid_size):
                heatmap.append({
                    "x": j / grid_size,
                    "y": i / grid_size,
                    "w": 1 / grid_size,
                    "h": 1 / grid_size,
                    "intensity": np.random.uniform(0.2, 0.8)
                })
        
        return heatmap
    
    def _generate_default_timeline(self, frame_count: int, fps: float):
        timeline = []
        duration = frame_count / fps if fps > 0 else frame_count
        
        num_points = min(20, frame_count)
        
        for i in range(num_points):
            timestamp = (i / num_points) * duration
            timeline.append({
                "t": float(timestamp),
                "score": float(np.random.uniform(0.3, 0.7))
            })
        
        return timeline
    
    def _calculate_contributions(self, modality_scores: dict):
        contributions = {}
        
        total = sum(v for v in modality_scores.values() if v is not None)
        
        if total == 0:
            return contributions
        
        for modality, score in modality_scores.items():
            if score is not None:
                contributions[modality] = {
                    "score": score,
                    "percentage": (score / total) * 100,
                    "weight": "high" if score > 0.7 else ("medium" if score > 0.4 else "low")
                }
        
        return contributions
    
    def _identify_key_indicators(self, modality_scores: dict, explainability_data: dict):
        indicators = []
        
        for modality, score in modality_scores.items():
            if score is None:
                continue
            
            if score > 0.7:
                indicators.append({
                    "modality": modality,
                    "severity": "high",
                    "description": f"High manipulation probability detected in {modality} analysis"
                })
            elif score > 0.5:
                indicators.append({
                    "modality": modality,
                    "severity": "medium",
                    "description": f"Moderate manipulation indicators in {modality} analysis"
                })
        
        if explainability_data.get("metadata_flags"):
            indicators.append({
                "modality": "metadata",
                "severity": "medium",
                "description": f"Metadata anomalies: {', '.join(explainability_data['metadata_flags'])}"
            })
        
        return indicators
    
    def generate_report(self, analysis_result: dict):
        report = {
            "summary": {
                "verdict": analysis_result["label"],
                "confidence": analysis_result["confidence_score"],
                "risk_level": analysis_result["risk_level"]
            },
            "details": {
                "modality_breakdown": analysis_result["modality_scores"],
                "key_findings": [],
                "recommendations": []
            }
        }
        
        if analysis_result["label"] == "manipulated":
            report["details"]["key_findings"].append(
                "Media shows signs of digital manipulation"
            )
            report["details"]["recommendations"].append(
                "Manual forensic review recommended"
            )
        else:
            report["details"]["key_findings"].append(
                "No significant manipulation detected"
            )
        
        return report
