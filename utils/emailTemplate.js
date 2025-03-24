// utils/emailTemplate.js

/**
 * Generates HTML email template for company notifications
 * @param {Object} enquiry - The enquiry data
 * @returns {String} HTML content for email
 */
exports.generateCompanyEmailTemplate = (enquiry) => {
  return `
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
    <h1 style="text-align: center; color: #006452;">New Enquiry Received</h1>
    
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="color: #444;">Enquiry Details</h2>
      <p><strong>From:</strong> ${enquiry.name}</p>
      <p><strong>Email:</strong> ${enquiry.email}</p>
      <p><strong>Mobile:</strong> ${enquiry.mobile}</p>
      
      <h3 style="color: #444; margin-top: 20px;">Message:</h3>
      <div style="background-color: white; padding: 15px; border-left: 3px solid #006452; margin-top: 5px;">
        ${enquiry.description}
      </div>
    </div>
    
    <p style="text-align: center; color: #666;">Please respond to this enquiry as soon as possible.</p>
    <p style="text-align: center; font-size: 12px; color: #999; margin-top: 30px;">
      This is an automated message. Please do not reply directly to this email.<br>
      © ${new Date().getFullYear()} Interior Design Platform. All rights reserved.
    </p>
  </div>
  `;
};

/**
 * Generates HTML email template for admin notifications
 * @param {Object} enquiry - The enquiry data
 * @returns {String} HTML content for email
 */
exports.generateAdminEmailTemplate = (enquiry) => {
  return `
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
    <h1 style="text-align: center; color: #006452;">New Enquiry Notification</h1>
    
    <div style="background: #e6f7f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="color: #444;">Company Information</h2>
      <p><strong>Company:</strong> ${enquiry.companyName}</p>
      <p><strong>Company ID:</strong> ${enquiry.companyId}</p>
    </div>
    
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="color: #444;">Enquiry Details</h2>
      <p><strong>From:</strong> ${enquiry.name}</p>
      <p><strong>Email:</strong> ${enquiry.email}</p>
      <p><strong>Mobile:</strong> ${enquiry.mobile}</p>
      
      <h3 style="color: #444; margin-top: 20px;">Message:</h3>
      <div style="background-color: white; padding: 15px; border-left: 3px solid #006452; margin-top: 5px;">
        ${enquiry.description}
      </div>
    </div>
    
    <p style="text-align: center; color: #666;">This enquiry has been saved to the database.</p>
    <p style="text-align: center; font-size: 12px; color: #999; margin-top: 30px;">
      This is an automated message from your Interior Design Platform.<br>
      © ${new Date().getFullYear()} Interior Design Platform. All rights reserved.
    </p>
  </div>
  `;
};

/**
 * Generates HTML email template for user confirmations
 * @param {Object} enquiry - The enquiry data
 * @returns {String} HTML content for email
 */
exports.generateUserEmailTemplate = (enquiry) => {
  return `
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
    <h1 style="text-align: center; color: #006452;">Your Enquiry Confirmation</h1>
    
    <p style="font-size: 16px; line-height: 1.6;">Dear ${enquiry.name},</p>
    
    <p style="font-size: 16px; line-height: 1.6;">Thank you for your enquiry to ${enquiry.companyName}. We have received your message and will get back to you shortly.</p>
    
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="color: #444;">Your Enquiry Details</h2>
      
      <h3 style="color: #444; margin-top: 20px;">Message:</h3>
      <div style="background-color: white; padding: 15px; border-left: 3px solid #006452; margin-top: 5px;">
        ${enquiry.description}
      </div>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6;">Best regards,<br>The ${enquiry.companyName} Team</p>
    
    <p style="text-align: center; font-size: 12px; color: #999; margin-top: 30px;">
      This is an automated confirmation message, please do not reply directly to this email.<br>
      © ${new Date().getFullYear()} Interior Design Platform. All rights reserved.
    </p>
  </div>
  `;
};

/**
 * Generates HTML email template for quote summaries (from your existing template)
 * @param {Object} data - The quote data
 * @returns {String} HTML content for email
 */
exports.generateEmailTemplate = (data) => `
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
    <h1 style="text-align: center; color: #333;">Interior Design Quote Summary</h1>
    
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="color: #444;">Project Details</h2>
      <p><strong>Scope:</strong> ${data.scope}</p>
      <p><strong>Home Type:</strong> ${data.homeType}</p>
      <p><strong>Carpet Area:</strong> ${data.carpetArea} sq ft</p>
      <p><strong>Selected Rooms:</strong> ${data.rooms.join(', ')}</p>
      <p><strong>Package:</strong> ${data.package}</p>
      <p><strong>Estimated Cost:</strong> $${data.estimatedCost}</p>
      
      <h2 style="color: #444; margin-top: 20px;">Your Details</h2>
      <p><strong>Name:</strong> ${data.userDetails.name}</p>
      <p><strong>Email:</strong> ${data.userDetails.email}</p>
      <p><strong>Phone:</strong> ${data.userDetails.phone}</p>
      <p><strong>City:</strong> ${data.userDetails.city}</p>
    </div>
    
    <p style="text-align: center; color: #666;">Thank you for choosing our services!</p>
  </div>
`;