const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

// Get all posts
router.get('/', postController.getAllPosts);

// Create a new post
router.post('/', postController.createPost);

// Get a post by ID
router.get('/:id', postController.getPostById);

// Update a post by ID
router.put('/:id', postController.updatePostById);

// Delete a post by ID
router.delete('/:id', postController.deletePostById);

module.exports = router;