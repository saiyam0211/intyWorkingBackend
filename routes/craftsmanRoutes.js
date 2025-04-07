// routes/craftsmanRoutes.js
const express = require('express');
const router = express.Router();
const Craftsman = require('../models/Craftsman');
const mongoose = require('mongoose');

// @route   GET api/craftsmen
// @desc    Get all craftsmen with optional filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, location, specialty, minRate, maxRate, sort, showAll } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Only show listed craftsmen by default (for public access)
    // Admin can see all craftsmen by using showAll query parameter
    if (showAll !== 'true') {
      // Check both show and isListed fields - either can make a craftsman unlisted
      filter.$and = [
        { $or: [{ show: { $ne: false } }, { show: { $exists: false } }] },
        { $or: [{ isListed: { $ne: false } }, { isListed: { $exists: false } }] }
      ];
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (location) {
      // Case-insensitive location search that checks both location field and availableCities array
      filter.$or = [
        { location: { $regex: location, $options: 'i' } },
        { availableCities: { $elemMatch: { $regex: location, $options: 'i' } } }
      ];
    }

    if (specialty) {
      // Case-insensitive specialty search
      filter.specialty = { $regex: specialty, $options: 'i' };
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
        case 'experience':
          sortOption = { experience: -1 }; // Assuming higher experience is better
          break;
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        default:
          sortOption = { order: 1, createdAt: -1 }; // Default sort by order, then newest
      }
    } else {
      sortOption = { order: 1, createdAt: -1 }; // Default sort by order, then newest
    }
    
    const craftsmen = await Craftsman.find(filter)
      .sort(sortOption)
      .select('-__v'); // Exclude version field
    
    res.json(craftsmen);
  } catch (err) {
    console.error('Error fetching craftsmen:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET api/craftsmen/:id
// @desc    Get craftsman by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    // Check if id is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Craftsman not found - Invalid ID' });
    }

    const craftsman = await Craftsman.findById(req.params.id).select('-__v');
    
    if (!craftsman) {
      return res.status(404).json({ message: 'Craftsman not found' });
    }
    
    res.json(craftsman);
  } catch (err) {
    console.error('Error fetching craftsman by ID:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST api/craftsmen
// @desc    Create a new craftsman
// @access  Private (would normally have auth middleware)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      rate,
      location,
      latitude,
      longitude,
      category,
      experience,
      projectsCompleted,
      specialty,
      description,
      phoneNumber,
      email,
      portfolio,
      googleReviews,
      rating,
      show = false, // Default to unlisted status until admin review
      isListed = false, // Default to unlisted status
      order // Optional custom order
    } = req.body;
    
    // Extract numeric value from rate for filtering
    let rateNumeric = 0;
    const rateMatch = rate.match(/\d+/);
    if (rateMatch) {
      rateNumeric = parseInt(rateMatch[0], 10);
    }
    
    // Determine the order for the new craftsman
    let craftsmanOrder;
    if (order !== undefined) {
      // If order is provided, use it
      craftsmanOrder = order;
      
      // Adjust other craftsmen's orders if needed
      await Craftsman.updateMany(
        { order: { $gte: order } },
        { $inc: { order: 1 } }
      );
    } else {
      // If no order is provided, find the next available order
      const lastCraftsman = await Craftsman.findOne().sort({ order: -1 });
      craftsmanOrder = lastCraftsman ? lastCraftsman.order + 1 : 0;
    }
    
    // Create new craftsman instance
    const newCraftsman = new Craftsman({
      name,
      rate,
      rateNumeric,
      location,
      availableCities: req.body.availableCities || [location],
      latitude,
      longitude,
      category,
      experience,
      projectsCompleted,
      specialty,
      description,
      phoneNumber,
      email,
      portfolio,
      googleReviews,
      rating,
      show: false, // Ensure unlisted status
      isListed: false, // Ensure unlisted status
      order: craftsmanOrder
    });
    
    const craftsman = await newCraftsman.save();
    
    res.status(201).json({
      success: true,
      message: 'Craftsman created successfully. Your profile will be reviewed by our team before appearing on the site.',
      craftsman
    });
  } catch (err) {
    console.error('Error creating craftsman:', err);
    if (err.name === 'ValidationError') {
      // Extract and return validation errors
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT api/craftsmen/:id
// @desc    Update a craftsman
// @access  Private (would normally have auth middleware)
router.put('/:id', async (req, res) => {
  try {
    // Check if id is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Craftsman not found - Invalid ID' });
    }

    const {
      name,
      rate,
      location,
      latitude,
      longitude,
      category,
      experience,
      projectsCompleted,
      specialty,
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
    
    // Find the current craftsman
    const currentCraftsman = await Craftsman.findById(req.params.id);
    
    if (!currentCraftsman) {
      return res.status(404).json({ message: 'Craftsman not found' });
    }
    
    // Extract numeric value from rate for filtering
    let rateNumeric = 0;
    const rateMatch = rate?.match(/\d+/);
    if (rateMatch) {
      rateNumeric = parseInt(rateMatch[0], 10);
    }
    
    // Handle order reordering if a new order is provided and it's different
    let craftsmanOrder = currentCraftsman.order;
    if (order !== undefined && order !== currentCraftsman.order) {
      craftsmanOrder = order;
      
      // Adjust other craftsmen's orders as needed
      if (order > currentCraftsman.order) {
        // Moving down in the list
        await Craftsman.updateMany(
          { 
            order: { $gt: currentCraftsman.order, $lte: order },
            _id: { $ne: currentCraftsman._id }
          },
          { $inc: { order: -1 } }
        );
      } else {
        // Moving up in the list
        await Craftsman.updateMany(
          { 
            order: { $gte: order, $lt: currentCraftsman.order },
            _id: { $ne: currentCraftsman._id }
          },
          { $inc: { order: 1 } }
        );
      }
    }
    
    // Prepare the update object
    const craftsmanUpdate = {
      // Only include fields that are provided in the request
      ...(name !== undefined && { name }),
      ...(rate !== undefined && { rate }),
      ...(rateMatch && { rateNumeric }),
      ...(location !== undefined && { location }),
      ...(req.body.availableCities !== undefined && { availableCities: req.body.availableCities }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(category !== undefined && { category }),
      ...(experience !== undefined && { experience }),
      ...(projectsCompleted !== undefined && { projectsCompleted }),
      ...(specialty !== undefined && { specialty }),
      ...(description !== undefined && { description }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(email !== undefined && { email }),
      ...(portfolio !== undefined && { portfolio }),
      ...(googleReviews !== undefined && { googleReviews }),
      ...(rating !== undefined && { rating }),
      ...(show !== undefined && { show }),
      ...(isListed !== undefined && { isListed }),
      ...(craftsmanOrder !== currentCraftsman.order && { order: craftsmanOrder }),
      updatedAt: Date.now()
    };
    
    // Update the craftsman
    const updatedCraftsman = await Craftsman.findByIdAndUpdate(
      req.params.id,
      { $set: craftsmanUpdate },
      { new: true }
    );
    
    res.json(updatedCraftsman);
  } catch (err) {
    console.error('Error updating craftsman:', err.message);
    if (err.name === 'ValidationError') {
      // Extract and return validation errors
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE api/craftsmen/:id
// @desc    Delete a craftsman
// @access  Private (would normally have auth middleware)
router.delete('/:id', async (req, res) => {
  try {
    // Check if id is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Craftsman not found - Invalid ID' });
    }

    const craftsman = await Craftsman.findById(req.params.id);
    
    if (!craftsman) {
      return res.status(404).json({ message: 'Craftsman not found' });
    }
    
    // Remove the craftsman
    await craftsman.deleteOne();
    
    // Adjust orders of remaining craftsmen
    await Craftsman.updateMany(
      { order: { $gt: craftsman.order } },
      { $inc: { order: -1 } }
    );
    
    res.json({ message: 'Craftsman removed successfully' });
  } catch (err) {
    console.error('Error deleting craftsman:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT api/craftsmen/:id/toggle-status
// @desc    Toggle craftsman listing status (list/unlist)
// @access  Private (would normally have auth middleware)
router.put('/:id/toggle-status', async (req, res) => {
  try {
    // Check if id is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Craftsman not found - Invalid ID' });
    }

    const { show } = req.body;
    // Validate show parameter
    if (typeof show !== 'boolean') {
      return res.status(400).json({ message: 'Show parameter must be a boolean value' });
    }
    
    // Find and update the craftsman
    const craftsman = await Craftsman.findById(req.params.id);
    
    if (!craftsman) {
      return res.status(404).json({ message: 'Craftsman not found' });
    }
    
    craftsman.show = show;
    craftsman.updatedAt = Date.now();
    await craftsman.save();
    
    res.json({
      message: `Craftsman ${show ? 'listed' : 'unlisted'} successfully`,
      craftsman
    });
  } catch (err) {
    console.error('Error toggling craftsman status:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;