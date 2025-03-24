// controllers/designerController.js
const Designer = require('../models/Designer');

// Get all designers
exports.getAllDesigners = async (req, res) => {
  try {
    const designers = await Designer.find();
    res.status(200).json(designers);
  } catch (error) {
    console.error('Error fetching designers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch designers', 
      error: error.message 
    });
  }
};

// Get a single designer by ID
exports.getDesignerById = async (req, res) => {
  try {
    const designer = await Designer.findById(req.params.id);
    
    if (!designer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Designer not found' 
      });
    }
    
    res.status(200).json(designer);
  } catch (error) {
    console.error('Error fetching designer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch designer', 
      error: error.message 
    });
  }
};

// Create a new designer
exports.createDesigner = async (req, res) => {
  try {
    const newDesigner = new Designer(req.body);
    const savedDesigner = await newDesigner.save();
    
    res.status(201).json(savedDesigner);
  } catch (error) {
    console.error('Error creating designer:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to create designer', 
      error: error.message 
    });
  }
};

// Update a designer
exports.updateDesigner = async (req, res) => {
  try {
    const updatedDesigner = await Designer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedDesigner) {
      return res.status(404).json({ 
        success: false, 
        message: 'Designer not found' 
      });
    }
    
    res.status(200).json(updatedDesigner);
  } catch (error) {
    console.error('Error updating designer:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to update designer', 
      error: error.message 
    });
  }
};

// Delete a designer
exports.deleteDesigner = async (req, res) => {
  try {
    const designer = await Designer.findByIdAndDelete(req.params.id);
    
    if (!designer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Designer not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Designer deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting designer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete designer', 
      error: error.message 
    });
  }
};

// Toggle designer status (list/unlist))
exports.toggleStatus = async (req, res) => {
  try {
    const { show } = req.body;
    
    if (typeof show !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Show parameter must be a boolean value'
      });
    }
    
    const designer = await Designer.findByIdAndUpdate(
      req.params.id,
      { show },
      { new: true }
    );
    
    if (!designer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Designer not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: `Designer ${show ? 'listed' : 'unlisted'} successfully`,
      designer
    });
  } catch (error) {
    console.error('Error toggling designer status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update designer status', 
      error: error.message 
    });
  }
};