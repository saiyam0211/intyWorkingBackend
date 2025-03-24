// controllers/companyController.js
const Company = require('../models/Company');
const { cloudinary, upload, uploadFields, deleteFile } = require('../config/cloudinary');

// Helper function to upload Base64 image to Cloudinary
const uploadBase64Image = async (base64Image) => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'testimonials-images',
      resource_type: 'image'
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading Base64 image to Cloudinary:', error);
    throw error;
  }
};

// Helper function to calculate average from price range string (format: "min-max")
const calculateAverageFromRange = (rangeString) => {
  if (!rangeString || !rangeString.includes('-')) return '';

  try {
    const [min, max] = rangeString.split('-').map(num => parseInt(num.trim()));
    if (isNaN(min) || isNaN(max)) return '';
    return ((min + max) / 2).toString();
  } catch (error) {
    console.error('Error calculating average from range:', error);
    return '';
  }
};

// Get companies with pagination
// Modify this part in your companyController.js getCompanies function
const getCompanies = async (req, res) => {
  try {
    const {
      search,
      page = 1,
      limit,
      isAdmin,
      projectType,
      size,
      priceRange,
      location,
      type  // Add type parameter to destructuring
    } = req.query;

    console.log("Request params:", req.query);

    // Start with a base query
    let query = {};

    // Only show companies that are marked to show
    if (!isAdmin || isAdmin !== 'true') {
      query.show = true;
    }

    // Apply location filter first
    if (location) {
      // Instead of exact match, use $or with regex to match either exact array item or part of a comma-separated string
      query.$or = [
        { availableCities: location },
        { availableCities: { $regex: location, $options: 'i' } }
      ];
    }

    // Add type filter - THIS IS THE KEY CHANGE
    if (type) {
      console.log("Filtering by type:", type);
      console.log("Type filter query:", { type });
      query.type = { $regex: new RegExp('^' + type + '$', 'i') };
    }

    // Apply other search filters
    if (search || projectType || size || priceRange) {
      const searchConditions = [];

      if (search) searchConditions.push({ $text: { $search: search } });
      if (projectType) searchConditions.push({ projectType: projectType });
      if (size) searchConditions.push({ propertySizeRange: size });
      if (priceRange) searchConditions.push({ priceRange: priceRange });

      // If we have search conditions, add them to the query
      if (searchConditions.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({ $or: searchConditions });
      }
    }

    console.log("Final query:", JSON.stringify(query, null, 2));

    // Execute the query with pagination
    const limitNum = parseInt(limit) || 6;
    const skipNum = (parseInt(page) - 1) * limitNum;

    const companies = await Company.find(query)
      .sort({ topRated: -1, createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum)
      .exec();

    const count = await Company.countDocuments(query);

    res.json({
      companies,
      totalPages: Math.ceil(count / limitNum),
      currentPage: parseInt(page),
      totalCompanies: count
    });
  } catch (error) {
    console.error('Error in getCompanies:', error);
    res.status(500).json({
      message: 'Error fetching companies',
      error: error.message
    });
  }
};

const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);
    return res.status(201).json({
      ok: true,
      companyDetails: company
    });
  } catch (error) {
    console.error('Error in getCompanies:', error);
    res.status(500).json({
      message: 'Error fetching companies',
      error: error.message
    });
  }
};

// Middleware for handling file uploads
const handleUpload = upload.fields(uploadFields);

// Create a new company
const createCompany = async (req, res) => {
  handleUpload(req, res, async (err) => {
    // First check for multer/upload errors
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        message: err.message || 'Error uploading files',
        error: err.toString()
      });
    }

    try {
      // Log the request body and files for debugging
      console.log('Company body keys:', Object.keys(req.body));
      console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
      console.log('Request body:', req.body);
      console.log('Files received:', Object.keys(req.files || {}));
      console.log('bannerImagesUrls:', req.body.bannerImagesUrls);
      console.log('bannerImages array items:', Object.keys(req.body).filter(key => key.startsWith('bannerImages')));

      // Process price ranges to calculate averages
      let processedBasicRange = '';
      let processedPremiumRange = '';
      let processedLuxuryRange = '';

      if (req.body.basicPriceRange) {
        processedBasicRange = calculateAverageFromRange(req.body.basicPriceRange);
      }

      if (req.body.premiumPriceRange) {
        processedPremiumRange = calculateAverageFromRange(req.body.premiumPriceRange);
      }

      if (req.body.luxuryPriceRange) {
        processedLuxuryRange = calculateAverageFromRange(req.body.luxuryPriceRange);
      }

      // Create a company data object from the form fields
      const companyData = {
        // Original required fields
        name: req.body.name,
        projects: parseInt(req.body.projects) || 0,
        experience: parseInt(req.body.experience) || 0,
        branches: parseInt(req.body.branches) || 0,

        // New fields from form
        registeredCompanyName: req.body.registeredCompanyName || '',
        nameDisplay: req.body.nameDisplay || '',
        description: req.body.description || '',
        ageOfCompany: req.body.ageOfCompany || '',
        availableCities: Array.isArray(req.body.availableCities)
          ? req.body.availableCities
          : (req.body.availableCities ? [req.body.availableCities] : []),
        officialWebsite: req.body.officialWebsite || '',
        fullName: req.body.fullName || '',
        designation: req.body.designation || '',
        phoneNumber: req.body.phoneNumber || '',
        minMaxBudget: req.body.minMaxBudget || '',
        type: Array.isArray(req.body.type) ? req.body.type : 
              (req.body.type ? [req.body.type] : []),
        discountsOfferTimeline: req.body.discountsOfferTimeline || '',
        numberOfProjectsCompleted: req.body.numberOfProjectsCompleted || '',
        contactEmail: req.body.contactEmail || '',
        googleRating: req.body.googleRating || '',
        googleReviews: req.body.googleReviews || '',
        anyAwardWon: req.body.anyAwardWon || '',
        usp: req.body.usp || '',
        categoryType: req.body.categoryType || '',
        paymentType: req.body.paymentType || '',
        assured: req.body.assured || '',
        latitude: req.body.latitude || '',
        longitude: req.body.longitude || '',
        workInTeams: req.body.workInTeams || '',
        deliveryTimeline: req.body.deliveryTimeline || '',

        // Store both original ranges and calculated averages
        basicPriceRange: processedBasicRange,
        premiumPriceRange: processedPremiumRange,
        luxuryPriceRange: processedLuxuryRange,
        originalBasicPriceRange: req.body.basicPriceRange || '',
        originalPremiumPriceRange: req.body.premiumPriceRange || '',
        originalLuxuryPriceRange: req.body.luxuryPriceRange || '',

        // New search-related fields
        projectType: req.body.projectType || '',
        propertySizeRange: req.body.propertySizeRange || '',
        priceRange: req.body.priceRange || '',
        serviceCategories: Array.isArray(req.body.serviceCategories)
          ? req.body.serviceCategories
          : (req.body.serviceCategories ? [req.body.serviceCategories] : []),
        searchKeywords: Array.isArray(req.body.searchKeywords)
          ? req.body.searchKeywords
          : (req.body.searchKeywords ? req.body.searchKeywords.split(',').map(k => k.trim()) : []),
        specificNeighborhoods: Array.isArray(req.body.specificNeighborhoods)
          ? req.body.specificNeighborhoods
          : (req.body.specificNeighborhoods ? req.body.specificNeighborhoods.split(',').map(n => n.trim()) : []),

        // Initialize bannerImages as an empty array
        bannerImages: []
      };

      // Extract banner images from request
      const bannerImages = [];
      if (req.body.bannerImages) {
        // If bannerImages is sent as an array of fields with the same name
        if (Array.isArray(req.body.bannerImages)) {
          bannerImages.push(...req.body.bannerImages);
        } else {
          // If only one image is sent
          bannerImages.push(req.body.bannerImages);
        }
      }

      // Add banner images to company data
      companyData.bannerImages = bannerImages;

      // Add file URLs from Cloudinary if they exist
      if (req.files) {
        // Add logo if uploaded
        if (req.files.logo && req.files.logo[0]) {
          companyData.logo = req.files.logo[0].path;
        }

        // Modified banner images handling
        const bannerImages = [];
        for (let i = 0; i < 10; i++) {
          const fieldName = `bannerImage${i}`;
          if (req.files[fieldName] && req.files[fieldName][0]) {
            bannerImages.push(req.files[fieldName][0].path);
          }
        }
        
        // Only add banner images if there are any
        if (bannerImages.length > 0) {
          companyData.bannerImages = bannerImages;
        }

        // Add PDF documents if uploaded
        if (req.files.digitalBrochure && req.files.digitalBrochure[0]) {
          companyData.digitalBrochure = req.files.digitalBrochure[0].path;
        }

        if (req.files.testimonialsAttachment && req.files.testimonialsAttachment[0]) {
          companyData.testimonialsAttachment = req.files.testimonialsAttachment[0].path;
        }
      }

      // Process testimonials with Base64 images if provided
      if (req.body.testimonialsJson) {
        try {
          let testimonials = JSON.parse(req.body.testimonialsJson);

          // Process each testimonial
          for (let i = 0; i < testimonials.length; i++) {
            if (testimonials[i].image && testimonials[i].image.startsWith('data:image')) {
              // Upload Base64 image to Cloudinary
              testimonials[i].image = await uploadBase64Image(testimonials[i].image);
            }
          }

          // Add testimonials to company data
          companyData.testimonials = testimonials;
        } catch (error) {
          console.error('Error processing testimonials JSON:', error);
        }
      }

      // Create and save the company
      const company = new Company(companyData);
      const savedCompany = await company.save();

      console.log("Created Company: ", company);

      res.status(201).json(savedCompany);
    } catch (error) {
      console.error('Error creating company:', error);
      // Enhanced error response
      return res.status(400).json({
        message: error.message,
        error: error.toString(),
        stack: error.stack,
        validation: error.errors ? Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        })) : undefined
      });
    }
  });
};

// Update company
const updateCompany = async (req, res) => {
  handleUpload(req, res, async (err) => {
    if (err) {
      console.error('Upload error during update:', err);
      return res.status(400).json({
        message: err.message || 'Error uploading files',
        error: err.toString()
      });
    }

    try {
      // Get existing company to check for files to delete
      const existingCompany = await Company.findById(req.params.id);
      if (!existingCompany) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Create update object from request body
      const updates = { ...req.body };

      // Process price ranges to calculate averages
      if (updates.basicPriceRange) {
        // Store original range before processing
        updates.originalBasicPriceRange = updates.basicPriceRange;
        updates.basicPriceRange = calculateAverageFromRange(updates.basicPriceRange);
      }

      if (updates.premiumPriceRange) {
        // Store original range before processing
        updates.originalPremiumPriceRange = updates.premiumPriceRange;
        updates.premiumPriceRange = calculateAverageFromRange(updates.premiumPriceRange);
      }

      if (updates.luxuryPriceRange) {
        // Store original range before processing
        updates.originalLuxuryPriceRange = updates.luxuryPriceRange;
        updates.luxuryPriceRange = calculateAverageFromRange(updates.luxuryPriceRange);
      }

      // Handle numeric fields
      if (updates.projects) updates.projects = parseInt(updates.projects);
      if (updates.experience) updates.experience = parseInt(updates.experience);
      if (updates.branches) updates.branches = parseInt(updates.branches);

      // Handle array fields
      if (updates.availableCities) {
        updates.availableCities = Array.isArray(updates.availableCities)
          ? updates.availableCities
          : [updates.availableCities];
      }

      // Handle type field - ensure it's always an array
      if (updates.type) {
        if (Array.isArray(updates.type)) {
          // Keep as is if already an array
        } else if (typeof updates.type === 'string') {
          // Split comma-separated string into array
          updates.type = updates.type.split(',').map(t => t.trim()).filter(Boolean);
        } else {
          // Fallback to empty array for invalid types
          updates.type = [];
        }
        console.log("Processed type field for update:", updates.type);
      }

      // Handle new search-related array fields
      if (updates.serviceCategories) {
        updates.serviceCategories = Array.isArray(updates.serviceCategories)
          ? updates.serviceCategories
          : [updates.serviceCategories];
      }

      if (updates.searchKeywords) {
        updates.searchKeywords = Array.isArray(updates.searchKeywords)
          ? updates.searchKeywords
          : updates.searchKeywords.split(',').map(k => k.trim());
      }

      if (updates.specificNeighborhoods) {
        updates.specificNeighborhoods = Array.isArray(updates.specificNeighborhoods)
          ? updates.specificNeighborhoods
          : updates.specificNeighborhoods.split(',').map(n => n.trim());
      }

      // Handle banner images updates
      if (req.files) {
        const bannerImages = [];
        for (let i = 0; i < 10; i++) {
          const fieldName = `bannerImage${i}`;
          if (req.files[fieldName] && req.files[fieldName][0]) {
            // Delete old banner from Cloudinary if it exists
            if (existingCompany.bannerImages && existingCompany.bannerImages[i]) {
              await deleteFile(existingCompany.bannerImages[i]);
            }
            bannerImages.push(req.files[fieldName][0].path);
          } else if (existingCompany.bannerImages && existingCompany.bannerImages[i]) {
            // Keep existing image if no new one was uploaded
            bannerImages.push(existingCompany.bannerImages[i]);
          }
        }
        
        // Only update banner images if there are any
        if (bannerImages.length > 0) {
          updates.bannerImages = bannerImages;
        }
      }

      // Process file uploads and update URLs
      if (req.files) {
        // Update logo if uploaded
        if (req.files.logo && req.files.logo[0]) {
          // Delete old logo from Cloudinary
          if (existingCompany.logo) {
            await deleteFile(existingCompany.logo);
          }
          updates.logo = req.files.logo[0].path;
        }

        // Update PDF documents if uploaded
        if (req.files.digitalBrochure && req.files.digitalBrochure[0]) {
          // Delete old brochure from Cloudinary
          if (existingCompany.digitalBrochure) {
            await deleteFile(existingCompany.digitalBrochure);
          }
          updates.digitalBrochure = req.files.digitalBrochure[0].path;
        }

        if (req.files.testimonialsAttachment && req.files.testimonialsAttachment[0]) {
          // Delete old testimonials from Cloudinary
          if (existingCompany.testimonialsAttachment) {
            await deleteFile(existingCompany.testimonialsAttachment);
          }
          updates.testimonialsAttachment = req.files.testimonialsAttachment[0].path;
        }
      }

      // Process testimonials with Base64 images if provided
      if (req.body.testimonialsJson) {
        try {
          let testimonials = JSON.parse(req.body.testimonialsJson);

          // Process each testimonial
          for (let i = 0; i < testimonials.length; i++) {
            if (testimonials[i].image && testimonials[i].image.startsWith('data:image')) {
              // Upload Base64 image to Cloudinary
              testimonials[i].image = await uploadBase64Image(testimonials[i].image);
            }
          }

          // If replacing existing testimonials, delete old images
          if (existingCompany.testimonials && existingCompany.testimonials.length > 0) {
            for (const testimonial of existingCompany.testimonials) {
              if (testimonial.image) {
                await deleteFile(testimonial.image).catch(err =>
                  console.error('Error deleting testimonial image:', err)
                );
              }
            }
          }

          // Add testimonials to updates
          updates.testimonials = testimonials;
        } catch (error) {
          console.error('Error processing testimonials JSON:', error);
        }
      }

      // Ensure other fields are properly handled
      if (updates.usp) {
        updates.usp = updates.usp.toString().trim();
      }
      
      // Update the company in the database
      const company = await Company.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true }
      );

      res.json(company);
    } catch (error) {
      console.error('Error updating company:', error);
      res.status(400).json({
        message: error.message,
        error: error.toString(),
        validation: error.errors ? Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        })) : undefined
      });
    }
  });
};

// Delete company
const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Delete all files associated with this company from Cloudinary
    const fileFields = [
      'logo',
      'bannerImage1', 'bannerImage2', 'bannerImage3', 'bannerImage4', 'bannerImage5',
      'bannerImage6', 'bannerImage7', 'bannerImage8', 'bannerImage9', 'bannerImage10',
      'digitalBrochure', 'testimonialsAttachment'
    ];

    // Add testimonial images to files to be deleted
    if (company.testimonials && company.testimonials.length > 0) {
      for (const testimonial of company.testimonials) {
        if (testimonial.image) {
          await deleteFile(testimonial.image).catch(err =>
            console.error('Error deleting testimonial image:', err)
          );
        }
      }
    }

    // Delete files in parallel using Promise.all
    await Promise.all(
      fileFields
        .filter(field => company[field]) // Only process fields that have a value
        .map(field => deleteFile(company[field]))
    );

    // Delete company from database
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add this function to validate image URLs
const isValidImageUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Modify the upload endpoint
const uploadImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Your existing upload logic...
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'company-banners',
    });

    // Return both URL and public_id
    res.json({
      secure_url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
};

module.exports = {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyById,
  uploadImage
};