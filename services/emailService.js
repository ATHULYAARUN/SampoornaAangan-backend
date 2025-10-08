const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Email credentials not configured");
        return;
      }

      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      console.log("Email service initialized");
    } catch (error) {
      console.error("Email service error:", error.message);
    }
  }

  isConfigured() {
    return this.transporter !== null;
  }

  async sendCredentialsEmail(email, name, username, password) {
    try {
      if (!this.isConfigured()) {
        throw new Error("Email service is not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.");
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || "noreply@sampoornaangan.gov.in",
        to: email,
        subject: "SampoornaAngan - Your Account Credentials",
        html: `
          <h2>Welcome to SampoornaAngan</h2>
          <p>Dear ${name},</p>
          <p>Your account has been created. Here are your login credentials:</p>
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p>Please change your password after first login.</p>
        `,
        text: `Welcome to SampoornaAngan. Username: ${username}, Password: ${password}`
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email sent:", result.messageId);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("Email error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async testConnection() {
    try {
      if (!this.isConfigured()) {
        return { 
          success: false, 
          message: "Email service is not configured",
          configured: false
        };
      }
      
      await this.transporter.verify();
      return { 
        success: true, 
        message: "Email service is ready",
        configured: true,
        service: "Gmail SMTP"
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Email verification failed: ${error.message}`,
        configured: true,
        service: "Gmail SMTP"
      };
    }
  }

  getStatus() {
    return {
      configured: this.isConfigured(),
      service: this.isConfigured() ? "Gmail SMTP" : "Not Configured"
    };
  }
}

module.exports = new EmailService();