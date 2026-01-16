import os
import torch
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
        
        try:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            
            if self.face_cascade.empty():
                logger.error("Could not load Haar Cascade. Face detection disabled.")
                self.face_cascade = None
            else:
                logger.info("Initialized OpenCV Haar Cascade for face detection")
        except Exception as e:
            logger.error(f"Error initializing face detector: {e}")
            self.face_cascade = None

        self._load_model()
        logger.info(f"VisionDetector initialized on {self.device}")
    
    def _load_model(self):
        try:
            # Set up local model cache directory
            current_script_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.normpath(os.path.join(current_script_dir, ".."))
            model_cache_dir = os.path.join(project_root, "models", "pretrained")
            os.makedirs(model_cache_dir, exist_ok=True)
            
            # Switch to a more robust model
            model_name = "dima806/deepfake_vs_real_image_detection"
            logger.info(f"Loading pretrained model: {model_name}")
            
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
                return {"score": 0.5, "label": "error", "heatmap": None, "regions": []}
            
            # --- FACE EXTRACTION LOGIC ---
            face_crop = self._crop_face(image_rgb)
            
            if face_crop is not None:
                logger.info("Face detected! Analyzing face crop.")
                target_image = Image.fromarray(face_crop)
                analysis_mode = "face"
            else:
                logger.info("No face detected. Analyzing full image.")
                target_image = pil_image
                analysis_mode = "full"

            inputs = self.processor(images=target_image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probabilities = torch.softmax(logits, dim=1)
                predicted_class = torch.argmax(logits, dim=1).item()
            
            # Get label mapping from model config
            label_map = self.model.config.id2label
            
            # Find which index corresponds to "Fake" or "Real"
            fake_idx = None
            real_idx = None
            
            for idx, label_text in label_map.items():
                label_lower = label_text.lower()
                if "fake" in label_lower or "manipulated" in label_lower or "synthetic" in label_lower:
                    fake_idx = idx
                elif "real" in label_lower or "authentic" in label_lower or "genuine" in label_lower:
                    real_idx = idx
            
            # Calculate fake probability
            if fake_idx is not None:
                # Direct mapping found
                fake_prob = probabilities[0][fake_idx].item()
                logger.info(f"Using fake_idx={fake_idx}, fake_prob={fake_prob:.4f}")
            elif real_idx is not None:
                # Invert real probability
                fake_prob = 1.0 - probabilities[0][real_idx].item()
                logger.info(f"Using real_idx={real_idx}, inverted to fake_prob={fake_prob:.4f}")
            else:
                # Fallback: For dima806 model, Class 0=Real, Class 1=Fake
                fake_prob = probabilities[0][1].item()
                logger.warning(f"No label mapping found, using Class 1 as fallback: {fake_prob:.4f}")
            
            final_label = "fake" if fake_prob > 0.5 else "real"
            
            return {
                "score": float(fake_prob),
                "label": final_label,
                "confidence": float(max(fake_prob, 1.0 - fake_prob)),  # Confidence is max of both classes
                "heatmap": None,
                "regions": [],
                "meta": {"mode": analysis_mode}
            }
        
        except Exception as e:
            logger.error(f"Vision detection error: {str(e)}")
            return {
                "score": 0.5,
                "label": "error",
                "heatmap": None,
                "regions": []
            }

    def _crop_face(self, image_rgb: np.ndarray):
        """Detects and returns the largest face crop using OpenCV Haar Cascade."""
        if not self.face_cascade:
            return None
            
        try:
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
            
            # Detect faces
            faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            
            if len(faces) == 0:
                return None
            
            # Find largest face
            max_area = 0
            best_crop = None
            h, w, _ = image_rgb.shape
            
            for (x, y, w_box, h_box) in faces:
                # Add padding
                pad_w = int(w_box * 0.2)
                pad_h = int(h_box * 0.2)
                
                x1 = max(0, x - pad_w)
                y1 = max(0, y - pad_h)
                x2 = min(w, x + w_box + pad_w)
                y2 = min(h, y + h_box + pad_h)
                
                area = (x2 - x1) * (y2 - y1)
                if area > max_area:
                    max_area = area
                    best_crop = image_rgb[y1:y2, x1:x2]
            
            return best_crop
                
        except Exception as e:
            logger.error(f"Error in face cropping: {e}")
            return None
    
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
                
                del frame
            
            cap.release()
            MemoryManager.clear_memory()
            MemoryManager.log_memory_usage("After video processing: ")
            
            avg_score = np.mean(scores) if scores else 0.5
            most_common_label = max(set(labels), key=labels.count) if labels else "unknown"
            
            return {
                "score": float(avg_score),
                "label": most_common_label,
                "heatmap": None,
                "regions": []
            }
        
        except Exception as e:
            logger.error(f"Video detection error: {str(e)}")
            return {"score": 0.5, "label": "error", "heatmap": None, "regions": []}
