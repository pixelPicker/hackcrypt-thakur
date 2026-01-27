# HackCrypt - Advanced Deepfake Detection System

A comprehensive AI-powered deepfake detection platform that analyzes images, videos, and audio files using multi-modal machine learning techniques. The system provides detailed forensic analysis with confidence scores, risk levels, and explainability features.

![Project Banner](https://img.shields.io/badge/Status-Production-green) ![License](https://img.shields.io/badge/License-MIT-blue) ![Python](https://img.shields.io/badge/Python-3.9+-blue) ![Next.js](https://img.shields.io/badge/Next.js-15-black)

---

## 🎯 Overview

HackCrypt is a full-stack SaaS application designed to detect manipulated media (deepfakes) across multiple modalities. It combines state-of-the-art deep learning models with traditional computer vision techniques to provide accurate and explainable results.

### Key Features

- **Multi-Modal Detection**: Supports images, videos, and audio files
- **Advanced AI Models**: Utilizes Vision Transformers (ViT), Wav2Vec2, and LSTM architectures
- **Forensic Analysis**: Provides heatmaps, temporal anomaly detection, and lip-sync verification
- **Real-time Processing**: Upload and get results in seconds with progress tracking
- **Credit System**: Free tier with 3 credits for anonymous users, unlimited for registered users
- **Modern UI**: Beautiful, responsive interface with smooth animations
- **User Authentication**: Secure login/registration with NextAuth and Supabase

---

## 🏗️ Architecture

### Backend (FastAPI)

The backend is a RESTful API built with FastAPI that orchestrates multiple deepfake detection services:

#### Core Services

1. **VisionDetector** (`services/vision_detector.py`)
   - Model: `dima806/deepfake_vs_real_image_detection` (ViT)
   - Detects face manipulation in images and video frames
   - Supports face extraction and cropping for improved accuracy
   - GPU-accelerated inference with CUDA support

2. **AudioDetector** (`services/audio_detector.py`)
   - Model: `MelodyMachine/Deepfake-audio-detection` (Wav2Vec2)
   - Analyzes spectral features and tonal consistency
   - Optional vocal isolation using Demucs
   - Combines AI predictions with heuristic analysis

3. **TemporalDetector** (`services/temporal_detector.py`)
   - LSTM-based temporal consistency analysis
   - Detects frame-to-frame inconsistencies in videos
   - Generates anomaly timeline for visualization
   - Memory-efficient frame sampling

4. **LipSyncDetector** (`services/lipsync_detector.py`)
   - OpenCV-based facial landmark detection
   - Correlates mouth movements with audio energy
   - Uses Pearson correlation for sync scoring
   - Critical for detecting voice-swap deepfakes

5. **FusionEngine** (`services/fusion_engine.py`)
   - Weighted score aggregation across all modalities
   - Dynamic weighting based on media type:
     - Images: 100% vision
     - Audio: 100% audio
     - Videos: 30% lipsync, 25% vision, 20% audio, 20% temporal, 5% metadata
   - Adaptive fusion with confidence-based weighting

6. **ExplainabilityEngine** (`services/explainability.py`)
   - Generates human-readable explanations
   - Provides heatmaps for manipulated regions
   - Timeline visualization for temporal anomalies
   - Detailed modality breakdowns

#### API Endpoints

```python
POST /analyze
  - Upload media for analysis
  - Parameters: file (multipart/form-data), mode (user/guest)
  - Returns: AnalysisResult with scores and explainability data

GET /results/{job_id}
  - Retrieve analysis results
  - Returns: Cached analysis result

GET /me
  - Get current session info
  - Returns: Credits remaining and authentication status

GET /health
  - Health check endpoint
```

#### Credit System

- **Anonymous Users**: 3 free credits stored in secure HTTP-only cookies
- **Authenticated Users**: Unlimited credits
- Credits tracked via signed tokens using `itsdangerous`

#### Storage

- Local temporary storage for development (`temp_storage/`)
- Cloud storage ready with boto3 integration (AWS S3)
- Automatic cleanup of temporary files

---

### Frontend (Next.js)

A modern React application built with Next.js 15, TypeScript, and Tailwind CSS.

#### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **State Management**: TanStack Query (React Query)
- **Authentication**: NextAuth v5 + Supabase
- **UI Components**: Radix UI + shadcn/ui
- **Media Visualization**: WaveSurfer.js, Recharts

#### Pages

1. **Home Page** (`app/page.tsx`)
   - Landing page with hero section
   - Call-to-action buttons
   - Animated background and gradients
   - Responsive design

2. **Upload Page** (`app/upload/page.tsx`)
   - Drag-and-drop file upload
   - File preview with media player
   - Real-time upload and analysis progress
   - Credit tracking display
   - Error handling with user feedback

3. **Results Page** (`app/results/page.tsx`)
   - Forensic dashboard with detailed analysis
   - Confidence score visualization
   - Modality score breakdowns
   - Heatmap overlay for images
   - Timeline anomalies for videos
   - Media preview player

4. **Authentication Pages**
   - Login (`app/login/page.tsx`)
   - Registration (`app/register/page.tsx`)
   - Supabase integration for user management

#### Key Components

- **UploadDropzone**: Drag-and-drop file uploader with visual feedback
- **MediaPreview**: Universal media player (image/video/audio)
- **ConfidenceScore**: Circular progress indicator for detection score
- **HeatmapOverlay**: Visualizes manipulated regions on images
- **TimelineAnomalies**: Chart showing temporal inconsistencies
- **ModalityCard**: Individual modality score display
- **Navbar**: Navigation with auth state and credit display

#### API Integration

```typescript
// app/api.ts
analyzeMedia(file: File, mode: string): Promise<AnalysisResult>
getResult(jobId: string): Promise<AnalysisResult>
```

- Axios-based HTTP client
- Progress tracking for uploads
- Error handling with user-friendly messages
- Environment-based API URL configuration

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.9 or higher
- **Node.js**: 18 or higher
- **CUDA**: Optional (for GPU acceleration)
- **FFmpeg**: Required for video processing

### Backend Setup

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Create virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**

   ```bash
   # Create .env file
   DATABASE_URL=postgresql://user:password@localhost/dbname
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   S3_BUCKET_NAME=your_bucket
   ```

5. **Download models** (automatic on first run)
   - Vision: `dima806/deepfake_vs_real_image_detection`
   - Audio: `MelodyMachine/Deepfake-audio-detection`
   - Demucs: `htdemucs`
   - Face landmarks: `lbfmodel.yaml`

6. **Run the server**

   ```bash
   python main.py
   # or
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   Backend will be available at: `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Create .env.local file
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXTAUTH_SECRET=your_secret_key
   NEXTAUTH_URL=http://localhost:3000

   # Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Run development server**

   ```bash
   npm run dev
   ```

   Frontend will be available at: `http://localhost:3000`

---

## 📦 Project Structure

```
hackcrypt-thakur/
├── backend/
│   ├── api/
│   │   ├── routes.py          # API endpoints
│   │   └── schemas.py         # Pydantic models
│   ├── services/
│   │   ├── vision_detector.py     # Image/video frame analysis
│   │   ├── audio_detector.py      # Audio deepfake detection
│   │   ├── temporal_detector.py   # Video temporal analysis
│   │   ├── lipsync_detector.py    # Lip-sync verification
│   │   ├── fusion_engine.py       # Score aggregation
│   │   ├── explainability.py      # Result interpretation
│   │   └── media_processor.py     # Media file handling
│   ├── utils/
│   │   ├── logger.py          # Logging configuration
│   │   ├── storage.py         # File storage management
│   │   └── memory_manager.py  # GPU memory optimization
│   ├── models/
│   │   └── pretrained/        # Cached ML models
│   ├── main.py                # FastAPI application
│   └── requirements.txt       # Python dependencies
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Home page
│   │   ├── upload/            # Upload interface
│   │   ├── results/           # Analysis results
│   │   ├── login/             # Authentication
│   │   ├── register/          # User registration
│   │   └── api.ts             # API client
│   ├── components/
│   │   ├── UploadDropzone.tsx
│   │   ├── MediaPreview.tsx
│   │   ├── ConfidenceScore.tsx
│   │   ├── HeatmapOverlay.tsx
│   │   ├── TimelineAnomalies.tsx
│   │   ├── ModalityCard.tsx
│   │   ├── Navbar.tsx
│   │   └── ui/                # Reusable UI components
│   ├── context/
│   │   └── SessionContext.tsx # Session management
│   ├── lib/
│   │   ├── supabaseClient.ts  # Supabase configuration
│   │   └── utils.ts           # Utility functions
│   ├── styles/
│   │   └── globals.css        # Global styles
│   ├── auth.ts                # NextAuth configuration
│   └── package.json           # Node dependencies
│
└── README.md                  # This file
```

---

## 🔍 How It Works

### Analysis Pipeline

1. **Media Upload**
   - User uploads image/video/audio via frontend
   - File sent to `/analyze` endpoint
   - Stored temporarily or in cloud storage

2. **Media Processing**
   - Content type detection
   - Frame extraction for videos
   - Audio extraction from videos
   - Metadata parsing

3. **Multi-Modal Analysis**
   - **Images**: Vision detection only
   - **Audio**: Audio detection only
   - **Videos**: All detectors (vision, audio, temporal, lipsync)
   - Each detector returns a score (0-1 scale)

4. **Score Fusion**
   - Weighted averaging based on media type
   - Dynamic weighting based on detector confidence
   - Final score: 0 (authentic) to 1 (manipulated)

5. **Explainability Generation**
   - Heatmaps for visual manipulation
   - Timeline for temporal anomalies
   - Detailed modality breakdowns
   - Human-readable explanations

6. **Result Delivery**
   - JSON response with all analysis data
   - Frontend renders forensic dashboard
   - Media preview with overlays
   - Downloadable results (future feature)

### Detection Thresholds

```python
0.0 - 0.3  → Authentic (Low Risk)
0.3 - 0.6  → Suspicious (Medium Risk)
0.6 - 1.0  → Manipulated (High Risk)
```

---

## 🧪 Model Information

### Vision Detection

- **Model**: ViT (Vision Transformer)
- **Source**: `dima806/deepfake_vs_real_image_detection`
- **Accuracy**: ~95% on test datasets
- **Features**: Face detection, crop extraction, attention-based analysis

### Audio Detection

- **Model**: Wav2Vec2
- **Source**: `MelodyMachine/Deepfake-audio-detection`
- **Features**: Spectral flux, tonal consistency, vocal isolation
- **Processing**: 16kHz sampling, 10-second chunks

### Temporal Analysis

- **Model**: Custom LSTM
- **Architecture**: 2-layer LSTM (2048 → 512)
- **Features**: Frame-to-frame consistency, optical flow analysis

### Lip-Sync Detection

- **Technique**: OpenCV Facial Landmarks + Audio Energy Correlation
- **Method**: Pearson correlation between mouth movement and audio
- **Threshold**: Correlation < 0.15 indicates manipulation

---

## 🎨 Features Highlights

### Credit System

- Anonymous users: 3 free analyses
- Registered users: Unlimited analyses
- Session-based tracking with secure cookies
- No credit card required for trial

### Real-time Progress

- Upload progress (0-100%)
- Analysis progress with phase indicators
- Estimated time remaining
- Detailed status messages

### Forensic Dashboard

- Overall confidence score with risk level
- Individual modality scores
- Heatmap visualization
- Temporal anomaly timeline
- Metadata analysis
- Processing time metrics

### User Experience

- Drag-and-drop upload
- File preview before analysis
- Smooth animations and transitions
- Mobile-responsive design
- Dark theme optimized

---

## 🔐 Security

- **Authentication**: NextAuth v5 with JWT
- **User Management**: Supabase for secure user data
- **Credit Tokens**: Signed with `itsdangerous`
- **CORS**: Restricted to allowed origins
- **File Validation**: Type and size checks
- **Rate Limiting**: Coming soon

---

## 🚧 Future Enhancements

- [ ] Real-time video stream analysis
- [ ] Batch processing for multiple files
- [ ] API key generation for developers
- [ ] Premium subscription tiers
- [ ] Advanced heatmap generation with GradCAM
- [ ] Export results as PDF reports
- [ ] Integration with social media platforms
- [ ] Mobile apps (iOS/Android)
- [ ] Multi-language support
- [ ] Advanced user dashboard with analytics

---

## 📊 Performance

### Processing Times (Average)

- **Images**: 1-3 seconds
- **Audio (10s)**: 2-5 seconds
- **Videos (30s)**: 15-30 seconds (GPU)
- **Videos (30s)**: 45-90 seconds (CPU)

### System Requirements

**Minimum:**

- CPU: 4 cores
- RAM: 8 GB
- Storage: 10 GB (for models)
- GPU: Optional (CPU fallback available)

**Recommended:**

- CPU: 8+ cores
- RAM: 16 GB
- Storage: 20 GB SSD
- GPU: NVIDIA RTX 3060 or higher (12GB VRAM)

---

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**

- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check Python version: `python --version` (3.9+)
- Verify FFmpeg is installed: `ffmpeg -version`

**Models not downloading:**

- Check internet connection
- Increase timeout: `export HF_HUB_DOWNLOAD_TIMEOUT=120`
- Manually download to `backend/models/pretrained/`

**Frontend can't connect to backend:**

- Verify backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure CORS is configured correctly

**Out of memory errors:**

- Reduce video resolution in `media_processor.py`
- Lower `max_frames` in detector configs
- Use CPU mode if GPU memory is limited

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Hugging Face** - For hosting pretrained models
- **Supabase** - For authentication and database
- **Vercel** - For frontend hosting
- **OpenCV** - For computer vision utilities
- **FastAPI** - For the incredible web framework
- **Next.js** - For the powerful React framework

---

## 📧 Contact

For questions, issues, or collaboration:

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/hackcrypt-thakur/issues)
- **Email**: your.email@example.com

---

## ⭐ Show Your Support

If you find this project helpful, please consider giving it a star on GitHub!

---

**Built with ❤️ using AI and Machine Learning**
