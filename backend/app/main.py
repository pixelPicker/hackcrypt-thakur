from fastapi import FastAPI
from app.api.routes.analyze import router as analyze_router

app = FastAPI(title="HackCrypt Backend")

app.include_router(analyze_router, prefix="/analyze")

@app.get("/")
def health():
    return {"status": "ok"}
