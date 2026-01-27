FROM pytorch/pytorch:2.9.1-cuda12.6-cudnn9-runtime

ENV PYTHONUNBUFFERED=1 \
  PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
  git \
  ffmpeg \
  libgl1 \
  libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip

COPY /requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . .

EXPOSE 8000

CMD [ "uvicorn", "main:app", "--host" , "0.0.0.0"]