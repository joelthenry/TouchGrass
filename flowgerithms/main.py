from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms, models
import os

app = FastAPI()

# Request model: expects an image file path as a string.
class PredictionRequest(BaseModel):
    image_path: str

# -------------------------------
# Flower Classification Model
# -------------------------------
class FlowerCNN(nn.Module):
    def __init__(self, num_classes=5):
        super(FlowerCNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        # After two poolings, 224 becomes 56
        self.fc1 = nn.Linear(64 * 56 * 56, 128)
        self.fc2 = nn.Linear(128, num_classes)
    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = x.view(x.size(0), -1)
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x

device = torch.device("cpu")

# Load your trained flower classifier
flower_model = FlowerCNN(num_classes=5).to(device)
flower_model.load_state_dict(torch.load('/workspace/flower_model.pth', weights_only=True))
flower_model.eval()

# Define flower class names (must match your training labels)
classes = ["daisy", "dandelion", "rose", "sunflower", "tulip"]

# Preprocessing for your classification model (must match training)
classification_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
])

# -------------------------------
# Flower Detection (Pretrained Model)
# -------------------------------
# We'll use MobileNetV3 (pretrained on ImageNet) as a proxy to detect if an image likely contains a flower.
object_detector = models.mobilenet_v3_large(pretrained=True).to(device)
object_detector.eval()

# Use a simpler transform for detection
detection_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

# Approximate ImageNet indices for flowers (adjust as needed)
flower_class_indices = list(range(985, 999))
confidence_threshold = 0.2  # Only consider a detection if confidence >= 20%

# -------------------------------
# FastAPI Endpoint
# -------------------------------
@app.post("/detect_flower")
async def detect_flower(request: PredictionRequest):
    # Check that the file exists
    if not os.path.exists(request.image_path):
        raise HTTPException(status_code=400, detail="Image file not found.")

    try:
        # Open the image from the provided file path
        image = Image.open(request.image_path).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error loading image: {e}")

    # Step 1: Check if the image contains a flower using the object detector.
    detect_input = detection_transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        detection_outputs = object_detector(detect_input)
        # detection_outputs is a tensor of logits for ImageNet classes.
        probs = F.softmax(detection_outputs[0], dim=0)
        # Get the top 5 predictions.
        top_probs, top_indices = torch.topk(probs, 5)

    # For debugging (optional), you could print top_indices and top_probs.
    # print("Top 5 indices:", top_indices.tolist(), "Top 5 probs:", top_probs.tolist())

    # Check if any of the top predictions correspond to a flower class.
    detected_flower = False
    for prob, idx in zip(top_probs, top_indices):
        if idx.item() in flower_class_indices and prob.item() >= confidence_threshold:
            detected_flower = True
            break

    # If no flower is detected, return null.
    if not detected_flower:
        return {"predicted_class": None}

    # Step 2: If a flower is detected, run classification using your trained model.
    class_input = classification_transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        outputs = flower_model(class_input)
        class_probs = F.softmax(outputs, dim=1)
        confidence, predicted = torch.max(class_probs, 1)

    predicted_class = classes[predicted.item()]
    confidence_score = round(confidence.item(), 4)

    return {"predicted_class": predicted_class, "confidence": confidence_score}
