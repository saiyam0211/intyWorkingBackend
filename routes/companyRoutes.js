// routes/companyRoutes.js
const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Test route working' });
});

// Get all companies with pagination and location filtering
router.get('/', companyController.getCompanies);

// Get companies by batch (multiple IDs)
router.get('/batch', companyController.getCompaniesByIds);

// Get Company with a particular Id
router.get('/getCompany/:id', companyController.getCompanyById);

// GET Company for editing - new route to match frontend request
router.get('/edit/:id', companyController.getCompanyById);

// Create a new company - no upload middleware here as it's handled in controller
router.post('/', companyController.createCompany);

// Update a company - no upload middleware here as it's handled in controller
router.put('/edit/:id', companyController.updateCompany);

// Delete a company
router.delete('/delete/:id', companyController.deleteCompany);

// New route to get companies by location
router.get('/location/:city', async (req, res) => {
    try {
        // Pass the location parameter to the controller
        req.query.location = req.params.city;
        companyController.getCompanies(req, res);
    } catch (error) {
        console.error("Error fetching companies by location:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;    