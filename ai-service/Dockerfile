# This is a multi-stage Dockerfile for the AI service. It uses Ollama to run a local LLM model and exposes an API endpoint for inference.
FROM python:3.12-slim

# Set environment variables to optimize Python behavior
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1

# set working directory
WORKDIR /app

# Create a non-root user and group for running the application
RUN addgroup --system playerpro \
&& adduser --system --ingroup playerpro playerpro

# Install system dependencies
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Copy the application code to the container
COPY app ./app

RUN python -m compileall -q app

# Set the ownership of the application directory to the non-root user
RUN chown -R playerpro:playerpro /app

EXPOSE 8000

CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000","--workers","1"]
