// index.js (main server file)
require("dotenv").config(); // Load environment variables

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");

// Import all routes
const companyRoutes = require("./routes/companyRoutes");
const adminRoutes = require("./routes/adminRoutes");
const contactRoutes = require("./routes/contactRoutes");
const designerRoutes = require("./routes/designerRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const craftsmanRoutes = require("./routes/craftsmanRoutes");
const packageRoutes = require("./routes/packageRoutes.js");
const userRoutes = require("./routes/userRoutes.js"); // Import User routes
const blogRoutes = require("./routes/blogRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes"); // Import Testimonial routes
const exportRoutes = require("./routes/exportRoutes"); // Import Export routes
const importRoutes = require("./routes/importRoutes"); // Import Import routes
const subscriptionRoutes = require("./routes/subscriptionRoutes"); // Import Subscription routes
const paymentRoutes = require("./routes/paymentRoutes"); // Import Payment routes

const app = express();

// Connect to MongoDB
connectDB();

// Updated CORS Configuration
const corsOrigins = process.env.CORS_ORIGIN ? 
  process.env.CORS_ORIGIN.split(',') : 
  [
    'http://localhost:3000',
    'http://localhost:5173', 
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'https://inty-frontend.vercel.app',
    'https://inty-main.vercel.app'
  ];

console.log('CORS origins:', corsOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (corsOrigins.indexOf(origin) !== -1 || corsOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log('Origin rejected by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Middleware for parsing request bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create uploads directory if it doesn't exist
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// Create uploads/temp directory for file uploads if it doesn't exist
if (!fs.existsSync("./uploads/temp")) {
  fs.mkdirSync("./uploads/temp", { recursive: true });
}

// Routes
app.use("/api/companies", companyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/designers", designerRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/craftsmen", craftsmanRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/users', userRoutes); // Use User routes
app.use('/api/blogs', blogRoutes);
app.use('/api/testimonials', testimonialRoutes); // Use Testimonial routes
app.use('/api/export', exportRoutes); // Use Export routes
app.use('/api/import', importRoutes); // Use Import routes
app.use('/api/subscriptions', subscriptionRoutes); // Use Subscription routes
app.use('/api/payments', paymentRoutes); // Use Payment routes

// Simple test route
app.use('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// 404 handler - Keep before error handler
app.use((req, res, next) => {
  res.status(404).json({
    message: "Route not found",
    path: req.url
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : "Server error",
  });
});

// Get the port from environment or use default (3000)
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log("Available routes:");
  console.log("- GET /api/companies");
  console.log("- POST /api/companies");
  console.log("- PUT /api/companies/:id");
  console.log("- DELETE /api/companies/:id");
  console.log("- GET /api/contact");
  console.log("- POST /api/contact");
  console.log("- POST /api/contact/enquiry");
  console.log("- GET /api/contact/enquiries");
  console.log("- GET /api/contact/enquiry/:id");
  console.log("- PATCH /api/contact/enquiry/:id/status");
  console.log("- PATCH /api/contact/enquiry/:id/read");
  console.log("- DELETE /api/contact/enquiry/:id");
  console.log("- GET /api/test");
  console.log("- GET /api/designers");
  console.log("- GET /api/designers/:id");
  console.log("- POST /api/designers");
  console.log("- PUT /api/designers/:id");
  console.log("- DELETE /api/designers/:id");
  console.log("- GET /api/craftsmen");
  console.log("- GET /api/craftsmen/:id");
  console.log("- POST /api/craftsmen");
  console.log("- PUT /api/craftsmen/:id");
  console.log("- DELETE /api/craftsmen/:id");
  console.log("- GET /api/blogs");
  console.log("- POST /api/blogs");
  console.log("- GET /api/testimonials");
  console.log("- GET /api/testimonials/active");
  console.log("- POST /api/testimonials");
  console.log("- PUT /api/testimonials/:id");
  console.log("- DELETE /api/testimonials/:id");
  console.log("- PATCH /api/testimonials/:id/status");
  console.log("- POST /api/users/register");
  console.log("- POST /api/users/login");
  console.log("- GET /api/export/collections");
  console.log("- GET /api/export/:collection");
  console.log("- GET /api/export/full/database");
  console.log("- GET /api/export/full/json");
  console.log("- POST /api/import/companies");
  console.log("- POST /api/import/designers");
  console.log("- POST /api/import/craftsmen");
  console.log("- GET /api/subscriptions");
  console.log("- POST /api/subscriptions");
  console.log("- GET /api/payments");
  console.log("- POST /api/payments");
});