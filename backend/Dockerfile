FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

# Changed from "fastapi dev app.py" to directly use uvicorn
CMD ["fastapi", "run", "app.py"]
