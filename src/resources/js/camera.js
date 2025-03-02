document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const cameraView = document.getElementById('camera-view');
    const photoPreview = document.getElementById('photo-preview');
    const loadingState = document.getElementById('loading-state');
    const resultView = document.getElementById('result-view');
    
    const cameraStream = document.getElementById('camera-stream');
    const captureBtn = document.getElementById('capture-btn');
    const photoCanvas = document.getElementById('photo-canvas');
    const retakeBtn = document.getElementById('retake-btn');
    const confirmBtn = document.getElementById('confirm-btn');
    const saveBtn = document.getElementById('save-btn');
    const newSearchBtn = document.getElementById('new-search-btn');
    
    let stream = null;
    let photoData = null;
    let context = photoCanvas.getContext('2d');
    
    // Initialize camera
    function initCamera() {
        // Hide all views except camera
        cameraView.classList.remove('hidden');
        photoPreview.classList.add('hidden');
        loadingState.classList.add('hidden');
        resultView.classList.add('hidden');
        
        // Get user media
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }, 
            audio: false 
        })
        .then(function(mediaStream) {
            stream = mediaStream;
            cameraStream.srcObject = mediaStream;
        })
        .catch(function(error) {
            console.error('Camera access error:', error);
            alert('Unable to access the camera: ' + error.message);
        });
    }
    
    // Capture photo
    function capturePhoto() {
        // Set canvas dimensions to match video dimensions
        const width = cameraStream.videoWidth;
        const height = cameraStream.videoHeight;
        photoCanvas.width = width;
        photoCanvas.height = height;
        
        // Draw the current frame from the video to the canvas
        context.drawImage(cameraStream, 0, 0, width, height);
        
        // Get image data as base64 string
        photoData = photoCanvas.toDataURL('image/jpeg');
        
        // Stop camera stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        // Show preview
        cameraView.classList.add('hidden');
        photoPreview.classList.remove('hidden');
    }
    
    // Retake photo
    function retakePhoto() {
        // Reinitialize camera
        initCamera();
    }
    
    // Confirm photo and send for identification
    function confirmPhoto() {
        // Show loading state
        photoPreview.classList.add('hidden');
        loadingState.classList.remove('hidden');
        
        // Send photo to API for identification
        identifyFlower(photoData);
    }
    
    // Identify flower using external API
    function identifyFlower(imageData) {
        // Remove the data:image/jpeg;base64, prefix
        const base64Image = imageData.split(',')[1];
        
        // Make API request
        fetch('/api/identify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: base64Image })
        })
        .then(response => response.json())
        .then(data => {
            // Show results
            displayResults(data);
        })
        .catch(error => {
            console.error('Identification error:', error);
            alert('Error identifying flower: ' + error.message);
            // Go back to camera
            initCamera();
        });
    }
    
    // Display identification results
    function displayResults(data) {
        // Hide loading state
        loadingState.classList.add('hidden');
        resultView.classList.remove('hidden');
        
        // Set result image
        document.getElementById('result-image').src = photoData;
        
        // Update result data
        if (data && data.results && data.results.length > 0) {
            const result = data.results[0];
            document.getElementById('flower-name').textContent = result.name || 'Unknown Flower';
            document.getElementById('scientific-name').textContent = result.scientificName || 'Scientific name unavailable';
            
            // Set confidence percentage
            const confidence = Math.round(result.confidence * 100);
            document.getElementById('confidence-percent').textContent = confidence + '%';
            document.getElementById('confidence-fill').style.width = confidence + '%';
            
            // Set description
            document.getElementById('flower-description').textContent = result.description || 'No description available for this flower.';
        } else {
            document.getElementById('flower-name').textContent = 'Identification Failed';
            document.getElementById('scientific-name').textContent = 'Please try again with a clearer photo';
            document.getElementById('confidence-percent').textContent = '0%';
            document.getElementById('confidence-fill').style.width = '0%';
            document.getElementById('flower-description').textContent = 'We couldn\'t identify this flower. Please try taking another photo with better lighting and positioning the flower in the center of the frame.';
        }
    }
    
    // Save identified flower to collection
    function saveToCollection() {
        fetch('/api/save-flower', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                image: photoData,
                name: document.getElementById('flower-name').textContent,
                scientificName: document.getElementById('scientific-name').textContent
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Flower saved to your collection!');
                saveBtn.textContent = 'Saved to Collection';
                saveBtn.disabled = true;
            } else {
                alert('Error saving flower: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Save error:', error);
            alert('Error saving to collection: ' + error.message);
        });
    }
    
    // Event listeners
    captureBtn.addEventListener('click', capturePhoto);
    retakeBtn.addEventListener('click', retakePhoto);
    confirmBtn.addEventListener('click', confirmPhoto);
    saveBtn.addEventListener('click', saveToCollection);
    newSearchBtn.addEventListener('click', initCamera);
    
    // Initialize camera on page load
    initCamera();
});