# Deepfake Detection Backend

## Setup

### Local Development

1. Create virtual environment:

```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Start services with Docker:

```bash
docker-compose up redis postgres minio -d
```

4. Run FastAPI:

```bash
python main.py
```

5. Run Celery worker:

```bash
celery -A workers.tasks worker --loglevel=info
```

### Docker Deployment

```bash
docker-compose up --build
```

## API Endpoints

### POST /analyze

Upload media for analysis

**Request:**

- `file`: Media file (image/video/audio)

**Response:**

```json
{
  "job_id": "uuid",
  "status": "processing",
  "message": "Media uploaded successfully"
}
```

### GET /results/{job_id}

Get analysis results

**Response:**

```json
{
  "job_id": "uuid",
  "label": "manipulated",
  "confidence_score": 0.85,
  "risk_level": "High",
  "modality_scores": {
    "vision": 0.9,
    "audio": 0.8,
    "temporal": 0.85
  },
  "explainability": {
    "heatmap": [...],
    "anomalies_timeline": [...]
  }
}
```

## Architecture

- **FastAPI**: REST API server
- **Celery**: Async task processing
- **Redis**: Message broker and result backend
- **PostgreSQL**: Database
- **MinIO**: Object storage for media files

## ML Pipeline

1. **Media Processor**: Extracts frames, audio, metadata
2. **Vision Detector**: CNN-based image/video analysis
3. **Audio Detector**: Audio manipulation detection
4. **Temporal Detector**: Video temporal consistency
5. **Fusion Engine**: Multi-modal score fusion
6. **Explainability**: Generates interpretable results
