const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
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
        
        // Check if user is authenticated
        const userId = req.session && req.session.user ? req.session.user.id : 'anonymous';
        console.log('User ID for saving:', userId);
        
        // Log the entire request body to debug
        console.log('Request body:', req.body);
        
        const { image, name } = req.body || {};
        
        // More detailed logging
        if (!image) {
            console.log('No image found in request body. Keys available:', Object.keys(req.body || {}));
            return res.status(400).json({ success: false, message: 'No image provided' });
        }
        
        console.log('Image data received, length:', image.length);
        
        // Generate a unique filename
        const timestamp = Date.now();
        const filename = `flower_${timestamp}.jpg`;
        const filepath = path.join(uploadsDir, filename);
        console.log('Saving to path:', filepath);
        
        try {
            // Check if the image data is a valid base64 string
            if (!image.includes('base64')) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid image format. Must be base64 encoded.'
                });
            }
            
            // Extract the base64 data
            const base64Data = image.replace(/^data:image\/jpeg;base64,/, '')
                               .replace(/^data:image\/png;base64,/, '')
                               .replace(/^data:image\/\w+;base64,/, '');
            
            const imageBuffer = Buffer.from(base64Data, 'base64');
            
            // Save image to filesystem
            fs.writeFileSync(filepath, imageBuffer);
            console.log('File written successfully');
            
            // Save to database if user is logged in
            if (req.session && req.session.user && req.session.user.id) {
                try {
                    // Import pgp and create db connection
                    const pgp = require('pg-promise')();
                    const dbConfig = {
                        host: 'db',
                        port: 5432,
                        database: process.env.POSTGRES_DB,
                        user: process.env.POSTGRES_USER,
                        password: process.env.POSTGRES_PASSWORD
                    };
                    const db = pgp(dbConfig);
                    
                    // Default to "Unknown Flower" if name is not provided
                    const flowerName = name || "Unknown Flower";
                    
                    // First, check if there's a default flower entry or create one
                    let flowerId;
                    try {
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
                        
                        // Save the post
                        await db.none(
                            'INSERT INTO posts(img, flower_id, user_id) VALUES($1, $2, $3)',
                            [`/uploads/${filename}`, flowerId, req.session.user.id]
                        );
                        
                        console.log(`Saved to database: user_id=${req.session.user.id}, flower_id=${flowerId}`);
                    } catch (dbError) {
                        console.error('Database error:', dbError);
                        // Continue even if DB save fails - we already saved the file
                    }
                } catch (dbConnectError) {
                    console.error('Database connection error:', dbConnectError);
                }
            }
            
            return res.status(200).json({ 
                success: true, 
                filename,
                message: 'Photo saved successfully'
            });
        } catch (fileError) {
            console.error('File system error:', fileError);
            return res.status(500).json({ 
                success: false, 
                message: 'Error saving file to disk', 
                details: fileError.message 
            });
        }
    } catch (error) {
        console.error('Save photo error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error saving photo', 
            details: error.message 
        });
    }
});

module.exports = router;