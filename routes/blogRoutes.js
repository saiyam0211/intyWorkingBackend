const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { upload, cloudinary, deleteFile } = require('../config/cloudinary');

// Middleware to set the file category for blog images
const setBlogFileCategory = (req, res, next) => {
  req.fileCategory = 'blog-images';
  next();
};

// GET all blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ timestamp: -1 });
    res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET a specific blog by ID
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (err) {
    console.error('Error fetching blog:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST a new blog with Cloudinary upload
router.post('/', setBlogFileCategory, upload.single('image'), async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('File:', req.file);
    
    const { title, description } = req.body;
    
    // Check if required fields are present
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }
    
    // Get the Cloudinary URL from the uploaded file
    const image = req.file.path; // Cloudinary middleware puts the URL in path
    
    const newBlog = new Blog({
      title,
      description,
      image,
    });

    const savedBlog = await newBlog.save();
    console.log('Blog saved:', savedBlog);
    res.status(201).json(savedBlog);
  } catch (err) {
    console.error('Error creating blog:', err);
    res.status(400).json({ message: err.message });
  }
});

// Alternative route for creating a blog with a pre-uploaded image URL
router.post('/with-url', async (req, res) => {
  try {
    const { title, description, image } = req.body;
    
    // Check if required fields are present
    if (!title || !description || !image) {
      return res.status(400).json({ message: 'Title, description, and image URL are required' });
    }
    
    const newBlog = new Blog({
      title,
      description,
      image, // This is already a URL
    });

    const savedBlog = await newBlog.save();
    res.status(201).json(savedBlog);
  } catch (err) {
    console.error('Error creating blog:', err);
    res.status(400).json({ message: err.message });
  }
});

// PUT (update) a blog
router.put('/:id', setBlogFileCategory, upload.single('image'), async (req, res) => {
  try {
    const { title, description, existingImage } = req.body;
    const updates = { title, description };
    
    // If a new image is uploaded, update the image URL
    if (req.file) {
      updates.image = req.file.path;
      
      // Delete the old image if there is one
      const blog = await Blog.findById(req.params.id);
      if (blog && blog.image) {
        await deleteFile(blog.image);
      }
    } else if (existingImage) {
      // If no new image was uploaded but we have an existing image URL,
      // keep using the existing image
      updates.image = existingImage;
    }
    
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    
    if (!updatedBlog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    res.json(updatedBlog);
  } catch (err) {
    console.error('Error updating blog:', err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE a blog
router.delete('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Delete the image from Cloudinary if it exist
    if (blog.image) {
      await deleteFile(blog.image);
    }
    
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;