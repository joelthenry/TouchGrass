const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const pgp = require('pg-promise')();
const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
};

// Create a single database connection to be reused
const db = pgp(dbConfig);

// Ensure uploads directory exists
const uploadsDir = "/repository/uploads";
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Simple test endpoint for debugging
router.post('/test', (req, res) => {
    console.log('Test endpoint hit');
    console.log('Test request body:', req.body);
    
    return res.json({
      success: true,
      message: 'Test successful',
      received: req.body
    });
  });
  

router.get('/test', (req, res) => {
    res.json({ status: 'success', message: 'API is working' });
});

// Simple test endpoint for debugging
router.post('/test', (req, res) => {
  console.log('Test endpoint hit');
  console.log('Test request body:', req.body);
  
  return res.json({
    success: true,
    message: 'Test successful',
    received: req.body
  });
});

// Add this simple GET endpoint:

router.get('/ping', (req, res) => {
  return res.json({ message: 'pong' });
});

// Save photo endpoint
router.post('/save-photo', async (req, res) => {
    try {
        console.log('Save photo endpoint hit');
        
        // Debug session to see what's available
        console.log('Session ID:', req.sessionID);
        console.log('Session data:', req.session);
        
        // Check if user is authenticated - FIXED VERSION
        const isAuthenticated = !!(req.session && req.session.user && req.session.user.id);
        console.log('User authentication status:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
        console.log('User ID:', isAuthenticated ? req.session.user.id : 'None');
        
        const userId = isAuthenticated ? req.session.user.id : 'anonymous';
        
        console.log('User ID for saving:', userId);
        
        const { image, name, latitude, longitude } = req.body || {};
        
        console.log('Location data:', { latitude, longitude });
        
        // Validate image data
        if (!image) {
            console.log('Image data received: No');
            return res.status(400).json({ 
                success: false, 
                message: 'No image provided' 
            });
        }
        
        console.log('Image data received: Yes');
        
        // Generate a unique filename and save the image
        const timestamp = Date.now();
        const filename = `flower_${timestamp}.jpg`;
        const filepath = path.join(uploadsDir, filename);
        
        try {
            // Process the image data
            const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            fs.writeFileSync(filepath, imageBuffer);
            console.log('Image saved to disk:', filepath);
            
            // Try to classify the flower
            try {
                const flowerResponse = await axios.post('http://flower-classifier:8000/detect_flower', {
                    image_path: filepath
                });
                
                console.log('Flower classification:', flowerResponse.data);
                
                // Get the predicted flower class and confidence
                const predictedClass = flowerResponse.data.predicted_class;
                const confidence = flowerResponse.data.confidence;
                
                // Capitalize first letter of flower name
                const flowerName = predictedClass.charAt(0).toUpperCase() + predictedClass.slice(1);
                
                // Only save to DB if authenticated
                if (isAuthenticated) {
                    // This will now work correctly
                    console.log('Creating database entry for authenticated user:', req.session.user.id);
                    // Create or get flower ID
                    let flowerId;
                    const flowerResult = await db.oneOrNone('SELECT id FROM flowers WHERE name = $1', [flowerName]);
                    
                    if (flowerResult) {
                        flowerId = flowerResult.id;
                        console.log('Using existing flower with ID:', flowerId);
                    } else {
                        const newFlower = await db.one(
                            'INSERT INTO flowers(name) VALUES($1) RETURNING id', 
                            [flowerName]
                        );
                        flowerId = newFlower.id;
                        console.log('Created new flower with ID:', flowerId);
                    }
                    
                    // Insert the post record with location data
                    const result = await db.one(
                        'INSERT INTO posts(img, flower_id, user_id, latitude, longitude) VALUES($1, $2, $3, $4, $5) RETURNING id',
                        [`/uploads/${filename}`, flowerId, req.session.user.id, latitude || null, longitude || null]
                    );
                    
                    console.log('Post saved with ID:', result.id);
                    
                    // Broadcast location update via Socket.IO if coordinates exist
                    if (latitude && longitude && req.io) {
                        req.io.emit('updateLocation', { 
                            latitude, 
                            longitude,
                            flowerName,
                            imageUrl: `/uploads/${filename}`
                        });
                        console.log('Location broadcast sent');
                    }
                    
                    // Return success with classification data and post ID
                    return res.status(200).json({ 
                        success: true, 
                        filename: filename,
                        postId: result.id,
                        flowerName: flowerName,
                        confidence: confidence,
                        message: `Identified as ${flowerName} (${Math.round(confidence * 100)}% confidence)`,
                        savedToCollection: true
                    });
                } else {
                    // Return success with just classification for anonymous users
                    return res.status(200).json({ 
                        success: true, 
                        filename: filename,
                        flowerName: flowerName,
                        confidence: confidence,
                        message: `Identified as ${flowerName} (${Math.round(confidence * 100)}% confidence)`,
                        savedToCollection: false,
                        loginPrompt: "Log in to save this to your collection!"
                    });
                }
                
            } catch (apiError) {
                console.error('Flower classification error:', apiError);
                
                // Use a default flower name
                const flowerName = name || "Unknown Flower";
                
                if (isAuthenticated) {
                    // Create or get flower ID for default name
                    let flowerId;
                    const flowerResult = await db.oneOrNone('SELECT id FROM flowers WHERE name = $1', [flowerName]);
                    
                    if (flowerResult) {
                        flowerId = flowerResult.id;
                    } else {
                        const newFlower = await db.one(
                            'INSERT INTO flowers(name) VALUES($1) RETURNING id', 
                            [flowerName]
                        );
                        flowerId = newFlower.id;
                    }
                    
                    // Insert the post with default flower
                    const result = await db.one(
                        'INSERT INTO posts(img, flower_id, user_id, latitude, longitude) VALUES($1, $2, $3, $4, $5) RETURNING id',
                        [`/uploads/${filename}`, flowerId, req.session.user.id, latitude || null, longitude || null]
                    );
                    
                    return res.status(200).json({ 
                        success: true, 
                        filename: filename,
                        postId: result.id,
                        flowerName: flowerName,
                        message: 'Photo saved successfully (classification failed)',
                        savedToCollection: true
                    });
                } else {
                    // For anonymous users
                    return res.status(200).json({ 
                        success: true, 
                        filename: filename,
                        flowerName: flowerName,
                        message: 'Photo saved successfully (classification failed)',
                        savedToCollection: false,
                        loginPrompt: "Log in to save this to your collection!"
                    });
                }
            }
            
        } catch (error) {
            console.error('Error saving photo:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Error saving photo', 
                details: error.message 
            });
        }
    } catch (error) {
        console.error('Save photo endpoint error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error', 
            details: error.message 
        });
    }
});

module.exports = router;