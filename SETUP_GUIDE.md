# SampoornaAngan Backend Setup Guide

This guide will help you set up the complete backend system for the SampoornaAngan application.

## 🎯 Quick Start

### 1. Prerequisites Check

Make sure you have:
- ✅ Node.js (v16+): `node --version`
- ✅ npm: `npm --version`
- ✅ MongoDB (local or Atlas account)
- ✅ Firebase project

### 2. Installation

```bash
# Navigate to backend directory
cd "d:\angan S9\backend"

# Install dependencies
npm install
```

### 3. Environment Configuration

```bash
# Copy environment template
copy .env.example .env

# Edit .env file with your configuration
notepad .env
```

### 4. Firebase Setup (Detailed)

#### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `sampoornaangan`
4. Enable Google Analytics (optional)
5. Create project

#### Step 2: Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password"
5. Save changes

#### Step 3: Generate Service Account Key
1. Go to Project Settings (gear icon)
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Extract the following values for your `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=key-id-from-json
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=client-id-from-json
```

### 5. MongoDB Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod --dbpath "C:\data\db"

# Update .env
MONGODB_URI=mongodb://localhost:27017/sampoornaangan
```

#### Option B: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account
3. Create new cluster
4. Create database user
5. Whitelist IP address (0.0.0.0/0 for development)
6. Get connection string
7. Update `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sampoornaangan
```

### 6. Initialize Database

```bash
# Run setup script
npm run setup
```

This will create:
- Database indexes
- Default admin account
- Initial configuration

### 7. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

You should see:
```
🚀 SampoornaAngan Backend Server Started
📍 Environment: development
🌐 Server running on port 5000
📊 Health check: http://localhost:5000/health
📚 API Base URL: http://localhost:5000/api
```

## 🧪 Testing the Setup

### 1. Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "SampoornaAngan Backend is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

### 2. Admin Login Test
```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"admin"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "admin": { ... },
    "token": "jwt-token-here",
    "role": "super-admin",
    "dashboard": "/admin-dashboard"
  }
}
```

### 3. Run Test Suite
```bash
npm test
```

## 🔧 Frontend Integration

### Update Frontend API Configuration

In your frontend project, update the API base URL:

```javascript
// frontend/src/config/api.js
const API_BASE_URL = 'http://localhost:5000/api';

export default {
  baseURL: API_BASE_URL,
  auth: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/login`,
    adminLogin: `${API_BASE_URL}/auth/admin/login`,
    logout: `${API_BASE_URL}/auth/logout`,
    me: `${API_BASE_URL}/auth/me`,
  },
  users: {
    profile: `${API_BASE_URL}/users/profile`,
    dashboard: `${API_BASE_URL}/users/dashboard`,
  },
  admin: {
    dashboard: `${API_BASE_URL}/admin/dashboard`,
    users: `${API_BASE_URL}/admin/users`,
  },
};
```

### Firebase Configuration for Frontend

Create `frontend/src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
```

## 🔐 Security Configuration

### 1. Update CORS Settings

In `server.js`, update CORS origins for production:

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
};
```

### 2. Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sampoornaangan
JWT_SECRET=your-super-long-and-complex-secret-key-for-production
ADMIN_PASSWORD=your-secure-admin-password
```

### 3. Rate Limiting Configuration

Adjust rate limits in `.env`:

```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window
```

## 📊 Monitoring and Maintenance

### 1. Log Files

Logs are output to console. For production, consider using:
- PM2 for process management
- Winston for advanced logging
- Log rotation tools

### 2. Database Monitoring

Monitor your MongoDB instance:
- Connection status
- Query performance
- Storage usage
- Index usage

### 3. Health Monitoring

Set up monitoring for:
- `/health` endpoint
- Response times
- Error rates
- Memory usage

## 🚨 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: 
- Check if MongoDB is running
- Verify connection string in `.env`
- Check network connectivity for Atlas

#### 2. Firebase Authentication Error
```
Error: Failed to initialize Firebase Admin SDK
```
**Solution**:
- Verify Firebase credentials in `.env`
- Check private key format (include \n characters)
- Ensure service account has proper permissions

#### 3. Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution**:
- Change PORT in `.env` file
- Kill process using the port: `netstat -ano | findstr :5000`

#### 4. CORS Error in Frontend
```
Access to fetch at 'http://localhost:5000/api/auth/login' from origin 'http://localhost:5174' has been blocked by CORS policy
```
**Solution**:
- Add frontend URL to CORS origins in `server.js`
- Restart backend server

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
DEBUG=sampoornaangan:*
```

### Database Reset

To reset the database:

```bash
# Connect to MongoDB
mongo sampoornaangan

# Drop database
db.dropDatabase()

# Re-run setup
npm run setup
```

## 📞 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review server logs
3. Verify environment configuration
4. Test individual components
5. Create an issue with detailed error information

## ✅ Setup Checklist

- [ ] Node.js and npm installed
- [ ] MongoDB running (local or Atlas)
- [ ] Firebase project created
- [ ] Authentication enabled in Firebase
- [ ] Service account key generated
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm install`)
- [ ] Database initialized (`npm run setup`)
- [ ] Server starts successfully (`npm run dev`)
- [ ] Health check passes
- [ ] Admin login works
- [ ] Tests pass (`npm test`)
- [ ] Frontend integration configured

## 🎉 Next Steps

Once setup is complete:

1. **Frontend Integration**: Connect your React frontend
2. **User Registration**: Test user registration flow
3. **Role-based Access**: Verify different user roles work
4. **Data Management**: Start adding real data
5. **Deployment**: Deploy to production environment

---

**Congratulations!** Your SampoornaAngan backend is now ready for development and testing.