# SampoornaAngan Backend API

A comprehensive backend system for the SampoornaAngan (Integrated Child Development Services) platform, built with Node.js, MongoDB, and Firebase Authentication.

## 🚀 Features

- **Role-based Authentication**: Firebase Auth for users, JWT for admin
- **User Management**: Complete CRUD operations for all user roles
- **Admin Dashboard**: Comprehensive admin panel with statistics
- **Security**: Rate limiting, input validation, error handling
- **Scalable Architecture**: Modular design with middleware support
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Firebase integration for real-time features

## 👥 User Roles Supported

1. **Super Admin** - System administration and oversight
2. **Anganwadi Worker** - Daily operations and data entry
3. **ASHA Volunteer** - Field support and outreach
4. **Parent/Guardian** - Child monitoring and tracking
5. **Adolescent Girl** - Personal health data access
6. **Sanitation Worker** - Waste collection management

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Firebase Admin SDK + JWT
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting
- **Environment**: dotenv
- **Development**: Nodemon

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Firebase project with Admin SDK
- npm or yarn package manager

## ⚙️ Installation

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/sampoornaangan

# Firebase Configuration (Get from Firebase Console)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-complex
JWT_EXPIRE=7d

# Admin Configuration
ADMIN_EMAIL=admin@sampoornaangan.gov.in
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication with Email/Password
4. Go to Project Settings > Service Accounts
5. Generate a new private key
6. Copy the credentials to your `.env` file

### 4. Database Setup

Run the setup script to initialize the database:

```bash
npm run setup
```

This will:
- Create database indexes
- Create default admin account
- Set up initial configuration

### 5. Start the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

#### User Authentication (Firebase)
```
POST /api/auth/register     - Register new user
POST /api/auth/login        - Login user with Firebase token
POST /api/auth/logout       - Logout user
GET  /api/auth/me          - Get current user data
```

#### Admin Authentication (JWT)
```
POST /api/auth/admin/login  - Admin login
POST /api/auth/admin/logout - Admin logout
GET  /api/auth/admin/me     - Get current admin data
```

### User Management Endpoints

#### User Routes
```
GET    /api/users/profile           - Get user profile
PUT    /api/users/profile           - Update user profile
GET    /api/users/dashboard         - Get user dashboard data
GET    /api/users/by-role/:role     - Get users by role
GET    /api/users/search            - Search users
GET    /api/users/stats             - Get user statistics
PUT    /api/users/preferences       - Update preferences
DELETE /api/users/account           - Deactivate account
```

#### Admin Routes
```
GET    /api/admin/dashboard         - Get admin dashboard
GET    /api/admin/users             - Get all users (paginated)
GET    /api/admin/users/search      - Search users
GET    /api/admin/users/export      - Export users data
GET    /api/admin/users/:id         - Get user by ID
PUT    /api/admin/users/:id         - Update user by ID
DELETE /api/admin/users/:id         - Delete/deactivate user
PUT    /api/admin/users/:id/reactivate - Reactivate user
GET    /api/admin/stats             - Get system statistics
```

### Request/Response Examples

#### User Registration
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "role": "parent",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "district": "Mumbai",
    "block": "Mumbai North"
  },
  "roleSpecificData": {
    "parentDetails": {
      "children": [
        {
          "name": "Child Name",
          "age": 5,
          "gender": "Male"
        }
      ],
      "occupation": "Teacher",
      "familySize": 4
    }
  }
}
```

#### Admin Login
```json
POST /api/auth/admin/login
{
  "identifier": "admin",
  "password": "admin"
}
```

#### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

## 🔐 Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Comprehensive validation using express-validator
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet Security**: Security headers and protection
- **JWT Authentication**: Secure token-based admin authentication
- **Firebase Integration**: Secure user authentication
- **Password Hashing**: bcrypt for admin password security
- **Account Locking**: Failed login attempt protection

## 🗄️ Database Schema

### User Model
- Basic information (name, email, phone)
- Role-based data structure
- Address information
- Preferences and settings
- Audit fields (created/updated by/at)

### Admin Model
- Admin credentials and profile
- Permissions and roles
- Session management
- Security features (account locking, 2FA ready)
- Audit trails

## 🚦 Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## 📊 Monitoring and Logging

- **Morgan**: HTTP request logging
- **Console Logging**: Structured error and info logging
- **Health Check**: `/health` endpoint for monitoring
- **Performance**: Built-in performance monitoring

## 🧪 Testing

Run tests:
```bash
npm test
```

## 📦 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sampoornaangan
# Update all other environment variables for production
```

### PM2 Deployment (Recommended)

```bash
npm install -g pm2
pm2 start server.js --name "sampoornaangan-api"
pm2 startup
pm2 save
```

## 🔧 Development

### Project Structure
```
backend/
├── config/          # Configuration files
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── scripts/         # Setup and utility scripts
├── server.js        # Main server file
├── package.json     # Dependencies and scripts
└── README.md        # This file
```

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run setup      # Initialize database and create admin
npm test           # Run tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with complete authentication system
- Role-based user management
- Admin dashboard functionality
- Firebase integration
- MongoDB database setup

---

**Note**: This backend is designed to work with the SampoornaAngan frontend application. Make sure to configure CORS settings appropriately for your frontend domain.