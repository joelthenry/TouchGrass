FROM python:3.9-slim

WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create workspace directory for model storage
RUN mkdir -p /workspace

# Copy application code (the . represents all files in the build context)
COPY . /app

# Set environment variables
ENV PYTHONPATH=/app
ENV MODEL_PATH=/workspace/flower_model.pth

# Expose the port for the FastAPI service
EXPOSE 8000

# Command to run the service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
