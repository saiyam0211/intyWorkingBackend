# Inty Backend API

This is the backend API for the Inty platform, an interior design aggregation marketplace.

## Features

- User authentication and authorization
- Company, designer, and craftsman profile management
- Contact and enquiry management
- File uploads to Cloudinary
- Payment processing with Razorpay
- Blog and testimonial management
- Data import/export capabilities
- Subscription and credit system

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Clerk Authentication
- Cloudinary for file storage
- Razorpay for payments

## Deployment

### Render Deployment

This project is configured for deployment on Render using the `render.yaml` file:

1. Create a new account or log in to [Render](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Choose "Deploy from GitHub" and select the repository
5. Set the environment variables as specified in `.env.example`
6. Click "Create Web Service"

### Environment Variables

Make sure to set the following environment variables in your deployment platform:

- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (defaults to 3000)
- `JWT_SECRET`: Secret key for JWT token generation
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `RAZORPAY_KEY_ID`: Razorpay key ID
- `RAZORPAY_KEY_SECRET`: Razorpay key secret
- `CORS_ORIGIN`: Comma-separated list of allowed origins (e.g., `https://inty-frontend.vercel.app,https://inty-backend.onrender.com`)
- `EMAIL_USER`: Email username for sending emails
- `EMAIL_PASS`: Email password or app password
- `ADMIN_EMAILS`: Comma-separated list of admin email addresses
- `CLERK_SECRET_KEY`: Clerk authentication secret key

## Local Development

1. Clone the repository
2. Create a `.env` file based on `.env.example`
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. The API will be available at `https://inty-backend.onrender.com`

## API Routes

The API exposes various endpoints for managing:

- Companies
- Designers
- Craftsmen
- Contacts and Enquiries
- Blogs
- Testimonials
- Users and Authentication
- Subscriptions and Payments
- File Uploads
- Data Import/Export

Refer to the console output when starting the server for a complete list of available routes. 