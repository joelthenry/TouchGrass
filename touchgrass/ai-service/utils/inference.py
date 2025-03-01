from flask import jsonify
import numpy as np
from keras.models import load_model
from .preprocessing import preprocess_image

flower_classifier = load_model('models/flower_classifier.h5')
flower_detector = load_model('models/flower_detector.h5')

def classify_flower(image):
    processed_image = preprocess_image(image)
    predictions = flower_classifier.predict(np.expand_dims(processed_image, axis=0))
    class_index = np.argmax(predictions, axis=1)[0]
    return jsonify({'class_index': class_index, 'confidence': predictions[0][class_index]})

def detect_flower(image):
    processed_image = preprocess_image(image)
    predictions = flower_detector.predict(np.expand_dims(processed_image, axis=0))
    return jsonify({'detections': predictions.tolist()})