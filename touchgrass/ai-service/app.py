from flask import Flask, request, jsonify
from utils.inference import classify_flower, detect_flower
from utils.preprocessing import preprocess_image

app = Flask(__name__)

@app.route('/api/classify', methods=['POST'])
def classify():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    image = preprocess_image(file)
    prediction = classify_flower(image)
    return jsonify({'prediction': prediction})

@app.route('/api/detect', methods=['POST'])
def detect():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    image = preprocess_image(file)
    detection_results = detect_flower(image)
    return jsonify({'detections': detection_results})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)