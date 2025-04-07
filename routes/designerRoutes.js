// routes/designerRoutes.js
const express = require('express');
const router = express.Router();
const Designer = require('../models/Designer');
const mongoose = require('mongoose');

// @route   GET api/designers
// @desc    Get all designers with optional filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { rating, location, minRate, maxRate, sort, showAll } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Only show listed designers by default (for public access)
    // Admin can see all designers by using showAll query parameter
    if (showAll !== 'true') {
      // Check both show and isListed fields - either can make a designer unlisted
      filter.$and = [
        { $or: [{ show: { $ne: false } }, { show: { $exists: false } }] },
        { $or: [{ isListed: { $ne: false } }, { isListed: { $exists: false } }] }
      ];
    }
    
    if (rating) {
      // Filter by minimum rating
      filter.rating = { $gte: rating };
    }
    
    if (location) {
      // Case-insensitive location search that checks both location field and availableCities array
      filter.$or = [
        { location: { $regex: location, $options: 'i' } },
        { availableCities: { $elemMatch: { $regex: location, $options: 'i' } } }
      ];
    }
    
    // Handle rate filtering
    if (minRate || maxRate) {
      filter.rateNumeric = {};
      if (minRate) filter.rateNumeric.$gte = parseInt(minRate);
      if (maxRate) filter.rateNumeric.$lte = parseInt(maxRate);
    }
    
    // Build sort object
    let sortOption = {};
    if (sort) {
      switch (sort) {
        case 'rate-asc':
          sortOption = { rateNumeric: 1 };
          break;
        case 'rate-desc':
          sortOption = { rateNumeric: -1 };
          break;
        case 'rating-desc':
          sortOption = { rating: -1 }; // Higher ratings first
          break;
        case 'experience':
          sortOption = { experience: -1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        default:
          sortOption = { order: 1, createdAt: -1 }; // Default sort by order, then by newest
      }
    } else {
      sortOption = { order: 1, createdAt: -1 }; // Default sort by order, then by newest
    }
    
    const designers = await Designer.find(filter)
      .sort(sortOption)
      .select('-__v'); // Exclude version field
    
    res.json(designers);
  } catch (err) {
    console.error('Error fetching designers:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET api/designers/:id
// @desc    Get designer by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    // Check if id is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Designer not found - Invalid ID' });
    }

    const designer = await Designer.findById(req.params.id).select('-__v');
    
    if (!designer) {
      return res.status(404).json({ message: 'Designer not found' });
    }
    
    res.json(designer);
  } catch (err) {
    console.error('Error fetching designer by ID:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST api/designers
// @desc    Create a new designer
// @access  Private (would normally have auth middleware)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      rate,
      location,
      latitude,
      longitude,
      experience,
      projectsCompleted,
      description,
      phoneNumber,
      email,
      portfolio,
      googleReviews,
      rating,
      show = false, // Default to unlisted status
      isListed = false, // Default to unlisted status
      order // Optional custom order
    } = req.body;
    
    // Extract numeric value from rate for filtering
    let rateNumeric = 0;
    const rateMatch = rate.match(/\d+/);
    if (rateMatch) {
      rateNumeric = parseInt(rateMatch[0], 10);
    }
    
    // Determine the order for the new designer
    let designerOrder;
    if (order !== undefined) {
      // If order is provided, use it
      designerOrder = order;
      
      // Adjust other designers' orders if needed
      await Designer.updateMany(
        { order: { $gte: order } },
        { $inc: { order: 1 } }
      );
    } else {
      // If no order is provided, find the next available order
      const lastDesigner = await Designer.findOne().sort({ order: -1 });
      designerOrder = lastDesigner ? lastDesigner.order + 1 : 0;
    }
    
    // Create new designer instance
    const newDesigner = new Designer({
      name,
      rate,
      rateNumeric,
      location,
      availableCities: req.body.availableCities || [location],
      latitude,
      longitude,
      experience,
      projectsCompleted,
      description,
      phoneNumber,
      email,
      portfolio,
      googleReviews,
      rating,
      show,
      isListed,
      order: designerOrder
    });
    
    const designer = await newDesigner.save();
    
    res.status(201).json({
      success: true,
      message: 'Designer created successfully. Your profile will be reviewed by an admin before being listed.',
      designer: designer
    });
  } catch (err) {
    console.error('Error creating designer:', err.message);
    if (err.name === 'ValidationError') {
      // Extract and return validation errors
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT api/designers/:id
// @desc    Update a designer
// @access  Private (would normally have auth middleware)
router.put('/:id', async (req, res) => {
  try {
    // Check if id is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Designer not found - Invalid ID' });
    }

    const {
      name,
      rate,
      location,
      latitude,
      longitude,
      experience,
      projectsCompleted,
      description,
      phoneNumber,
      email,
      portfolio,
      googleReviews,
      rating,
      show,
      isListed,
      order
    } = req.body;
    
    // Find the current designer
    const currentDesigner = await Designer.findById(req.params.id);
    
    if (!currentDesigner) {
      return res.status(404).json({ message: 'Designer not found' });
    }
    
    // Extract numeric value from rate for filtering
    let rateNumeric = 0;
    const rateMatch = rate?.match(/\d+/);
    if (rateMatch) {
      rateNumeric = parseInt(rateMatch[0], 10);
    }
    
    // Handle order reordering if a new order is provided and it's different
    let designerOrder = currentDesigner.order;
    if (order !== undefined && order !== currentDesigner.order) {
      designerOrder = order;
      
      // Adjust other designers' orders as needed
      if (order > currentDesigner.order) {
        // Moving down in the list
        await Designer.updateMany(
          { 
            order: { $gt: currentDesigner.order, $lte: order },
            _id: { $ne: currentDesigner._id }
          },
          { $inc: { order: -1 } }
        );
      } else {
        // Moving up in the list
        await Designer.updateMany(
          { 
            order: { $gte: order, $lt: currentDesigner.order },
            _id: { $ne: currentDesigner._id }
          },
          { $inc: { order: 1 } }
        );
      }
    }
    
    // Prepare the update object
    const designerUpdate = {
      // Only include fields that are provided in the request
      ...(name !== undefined && { name }),
      ...(rate !== undefined && { rate }),
      ...(rateMatch && { rateNumeric }),
      ...(location !== undefined && { location }),
      ...(req.body.availableCities !== undefined && { availableCities: req.body.availableCities }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(experience !== undefined && { experience }),
      ...(projectsCompleted !== undefined && { projectsCompleted }),
      ...(description !== undefined && { description }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(email !== undefined && { email }),
      ...(portfolio !== undefined && { portfolio }),
      ...(googleReviews !== undefined && { googleReviews }),
      ...(rating !== undefined && { rating }),
      ...(show !== undefined && { show }),
      ...(isListed !== undefined && { isListed }),
      ...(designerOrder !== currentDesigner.order && { order: designerOrder }),
      updatedAt: Date.now()
    };
    
    // Update the designer
    const updatedDesigner = await Designer.findByIdAndUpdate(
      req.params.id,
      { $set: designerUpdate },
      { new: true }
    );
    
    res.json(updatedDesigner);
  } catch (err) {
    console.error('Error updating designer:', err.message);
    if (err.name === 'ValidationError') {
      // Extract and return validation errors
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE api/designers/:id
// @desc    Delete a designer
// @access  Private (would normally have auth middleware)
router.delete('/:id', async (req, res) => {
  try {
    // Check if id is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Designer not found - Invalid ID' });
    }

    const designer = await Designer.findById(req.params.id);
    
    if (!designer) {
      return res.status(404).json({ message: 'Designer not found' });
    }
    
    // Remove the designer
    await designer.deleteOne();
    
    // Adjust orders of remaining designers
    await Designer.updateMany(
      { order: { $gt: designer.order } },
      { $inc: { order: -1 } }
    );
    
    res.json({ message: 'Designer removed successfully' });
  } catch (err) {
    console.error('Error deleting designer:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT api/designers/:id/toggle-status
// @desc    Toggle designer listing status (list/unlist)
// @access  Private (would normally have auth middleware)
router.put('/:id/toggle-status', async (req, res) => {
  try {
    // Check if id is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Designer not found - Invalid ID' });
    }

    const { show } = req.body;
    
    if (typeof show !== 'boolean') {
      return res.status(400).json({ message: 'Show parameter must be a boolean value' });
    }
    
    // Find and update the designer
    const designer = await Designer.findById(req.params.id);
    
    if (!designer) {
      return res.status(404).json({ message: 'Designer not found' });
    }
    
    designer.show = show;
    designer.updatedAt = Date.now();
    await designer.save();
    
    res.json({
      message: `Designer ${show ? 'listed' : 'unlisted'} successfully`,
      designer
    });
  } catch (err) {
    console.error('Error toggling designer status:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;