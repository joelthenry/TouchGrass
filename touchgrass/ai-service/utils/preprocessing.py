import numpy as np
import cv2
from sklearn.preprocessing import LabelEncoder

def load_and_preprocess_image(image_path):
    image = cv2.imread(image_path)
    image = cv2.resize(image, (224, 224))  # Resize to match model input
    image = image.astype("float32") / 255.0  # Normalize to [0, 1]
    return image

def preprocess_images(image_paths):
    images = [load_and_preprocess_image(path) for path in image_paths]
    return np.array(images)

def encode_labels(labels):
    le = LabelEncoder()
    encoded_labels = le.fit_transform(labels)
    return encoded_labels, le

def decode_labels(encoded_labels, label_encoder):
    return label_encoder.inverse_transform(encoded_labels)