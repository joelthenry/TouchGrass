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
    let context = photoCanvas ? photoCanvas.getContext('2d') : null;
    
    // Show error overlay
    function showError(message, isPermissionError = false) {
        console.error('Camera error:', message);
        
        if (!cameraView) {
            console.error('Camera view element not found');
            return;
        }
        
        // Create error overlay if it doesn't exist
        let errorDiv = document.querySelector('.camera-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'camera-error';
            
            let buttonHTML = isPermissionError ? 
                '<button id="open-settings" class="btn-primary">Open Camera Settings</button>' :
                '<button id="retry-camera" class="btn-primary">Try Again</button>';
            
            errorDiv.innerHTML = `
                <div class="error-content">
                    <i class="fa fa-exclamation-triangle"></i>
                    <h3>Camera Access Required</h3>
                    <p>${message}</p>
                    ${buttonHTML}
                </div>
            `;
            
            cameraView.appendChild(errorDiv);
            
            if (isPermissionError) {
                document.getElementById('open-settings').addEventListener('click', function() {
                    // Open browser settings - this is browser specific and may not work in all browsers
                    if (navigator.permissions && navigator.permissions.query) {
                        navigator.permissions.query({ name: 'camera' })
                            .then(permissionStatus => {
                                console.log('Camera permission status:', permissionStatus.state);
                                alert('Please enable camera access in your browser settings and reload the page.');
                            });
                    } else {
                        alert('Please enable camera access in your browser settings and reload the page.');
                    }
                });
            } else {
                document.getElementById('retry-camera').addEventListener('click', function() {
                    errorDiv.remove();
                    initCamera();
                });
            }
        } else {
            // Update existing error message
            errorDiv.querySelector('p').textContent = message;
        }
    }
    
    // Check if we can access media devices at all
    function checkMediaDevicesSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showError('Your browser does not support camera access. Please try using a modern browser like Chrome, Firefox, or Safari.');
            return false;
        }
        return true;
    }
    
    // Check permission status
    async function checkPermissionStatus() {
        if (!navigator.permissions || !navigator.permissions.query) {
            console.log('Permissions API not supported, skipping permission check');
            return 'unknown';
        }
        
        try {
            const result = await navigator.permissions.query({ name: 'camera' });
            console.log('Camera permission status:', result.state);
            return result.state; // 'granted', 'denied', or 'prompt'
        } catch (error) {
            console.log('Error checking camera permission:', error);
            return 'unknown';
        }
    }
    
    // Initialize camera
    async function initCamera() {
        if (!checkMediaDevicesSupport()) return;
        
        // Check permission status
        const permissionStatus = await checkPermissionStatus();
        
        if (permissionStatus === 'denied') {
            showError('Camera access is blocked by your browser settings. Please enable camera access and reload the page.', true);
            return;
        }
        
        console.log('Initializing camera...');
        
        // Stop any existing streams
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        // Hide all views except camera
        if (cameraView) cameraView.classList.remove('hidden');
        if (photoPreview) photoPreview.classList.add('hidden');
        if (loadingState) loadingState.classList.add('hidden');
        if (resultView) resultView.classList.add('hidden');
        
        // Create a manual camera activation button if permission is prompt or unknown
        if (permissionStatus === 'prompt' || permissionStatus === 'unknown') {
            // Show a button to request camera access
            if (!document.getElementById('camera-permission-button')) {
                const permissionButton = document.createElement('div');
                permissionButton.className = 'camera-permission-overlay';
                permissionButton.innerHTML = `
                    <button id="camera-permission-button" class="btn-primary">
                        <i class="fa fa-camera"></i> Enable Camera
                    </button>
                    <p>Click to access your camera</p>
                `;
                cameraView.appendChild(permissionButton);
                
                document.getElementById('camera-permission-button').addEventListener('click', function() {
                    permissionButton.remove();
                    accessCamera();
                });
                
                return; // Wait for button click
            }
        } else {
            // Directly try to access the camera if permission is already granted
            accessCamera();
        }
    }
    
    // Actually access the camera
    async function accessCamera() {
        try {
            // Remove any existing error messages
            const existingErrors = document.querySelectorAll('.camera-error');
            existingErrors.forEach(el => el.remove());
            
            console.log('Requesting camera access...');
            
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }, 
                audio: false 
            });
            
            console.log('Camera access granted:', stream);
            
            if (!cameraStream) {
                console.error('Camera stream element not found');
                return;
            }
            
            // Attach the stream to the video element
            cameraStream.srcObject = stream;
            cameraStream.style.display = 'block';
            
            // Play the video
            cameraStream.play().catch(error => {
                console.error('Error playing video:', error);
                showError('Could not start video stream. This may be due to hardware issues or browser restrictions.');
            });
            
            console.log('Camera initialized successfully');
        } catch (error) {
            console.error('Camera access error:', error);
            
            let errorMessage = "Unable to access the camera.";
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = "Camera access was denied. Please allow camera access in your browser settings.";
                showError(errorMessage, true);
            } else if (error.name === 'NotFoundError') {
                errorMessage = "No camera found on your device.";
                showError(errorMessage);
            } else if (error.name === 'NotReadableError' || error.name === 'AbortError') {
                errorMessage = "Your camera is currently in use by another application.";
                showError(errorMessage);
            } else if (error.name === 'SecurityError') {
                errorMessage = "Camera access is restricted. This may be because the site isn't served over HTTPS.";
                showError(errorMessage);
            } else {
                showError(errorMessage + " Error: " + error.message);
            }
        }
    }
    
    // Capture photo
    function capturePhoto() {
        if (!stream || !cameraStream || !photoCanvas) {
            showError("Camera not properly initialized. Please try again.");
            return;
        }
        
        try {
            // Set canvas dimensions to match video dimensions
            const width = cameraStream.videoWidth;
            const height = cameraStream.videoHeight;
            
            if (!width || !height) {
                showError("Cannot capture photo: video dimensions not available.");
                return;
            }
            
            photoCanvas.width = width;
            photoCanvas.height = height;
            
            // Draw the current frame from the video to the canvas
            context.drawImage(cameraStream, 0, 0, width, height);
            
            // Get image data as base64 string
            photoData = photoCanvas.toDataURL('image/jpeg');
            
            // Stop camera stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            
            // Show preview
            cameraView.classList.add('hidden');
            photoPreview.classList.remove('hidden');
        } catch (error) {
            console.error('Error capturing photo:', error);
            showError("Failed to capture photo: " + error.message);
        }
    }
    
    // Other functions remain the same...
    
    // Event listeners
    if (captureBtn) captureBtn.addEventListener('click', capturePhoto);
    if (retakeBtn) retakeBtn.addEventListener('click', retakePhoto);
    if (confirmBtn) confirmBtn.addEventListener('click', confirmPhoto);
    if (saveBtn) saveBtn.addEventListener('click', saveToCollection);
    if (newSearchBtn) newSearchBtn.addEventListener('click', initCamera);
    
    // Initialize camera on page load
    initCamera();
});