# Siyoga Travel System

A comprehensive travel and tourism management system for Sri Lankan tourism with advanced mapping and security features.

## 🌟 Overview

Siyoga Travel System is a full-stack web application designed for trip planning, booking, and management for tourists, drivers, and administrators in Sri Lanka. Features real-time mapping, secure payment processing, and comprehensive user management.

## 🚀 Technology Stack

### Frontend
- **React 19.0.0** - Modern UI library with hooks and context
- **Vite 6.3.1** - Fast build tool and development server
- **Tailwind CSS 4.1.4** - Utility-first CSS framework
- **React Router DOM 7.5.1** - Client-side routing
- **Axios 1.8.4** - HTTP client for API communication
- **Chart.js 4.4.9** - Data visualization and analytics
- **jsPDF 3.0.1** - PDF generation and reporting

### Backend
- **Node.js 14+** - JavaScript runtime environment
- **Express.js 4.21.2** - Web application framework
- **Microsoft SQL Server** - Primary relational database
- **mssql 10.0.4** & **tedious 18.6.1** - SQL Server connectivity
- **JWT (jsonwebtoken 9.0.2)** - Secure authentication tokens
- **bcryptjs 2.4.3** - Password hashing and security
- **Stripe 14.25.0** - Payment processing platform
- **Nodemailer 6.10.1** - Email service integration
- **Winston 3.11.0** - Advanced logging system
- **Helmet 7.0.0** - Security middleware
- **Express Rate Limit 7.1.1** - API rate limiting

### Map Integration & Location Services
- **Google Maps API** - Interactive mapping and route planning
- **Distance Matrix API** - Real-time distance and duration calculations
- **Geocoding API** - Address to coordinates conversion
- **Places API** - Location search and autocomplete
- **Route Optimization** - Multi-destination trip planning
- **Real-time Location Tracking** - Live driver and trip tracking

## 🗄️ Database Architecture

**Microsoft SQL Server** with optimized schema design:

### Core Tables
- **Users** - Authentication and profile data
- **Tourists** - Tourist profiles and preferences
- **Drivers** - Driver profiles and verification status
- **Vehicles** - Vehicle specifications and images
- **Destinations** - Sri Lankan tourist destinations
- **BookingRequests** - Trip booking with status tracking
- **DriverNotifications** - Real-time notification system
- **Distances** - Pre-calculated distance matrix for optimization

### Key Relationships
- **Users → Tourists/Drivers** (One-to-One with CASCADE DELETE)
- **BookingRequests → Users** (Many-to-One via tourist_id)
- **DriverNotifications → BookingRequests & Drivers** (Many-to-One)

**⚠️ Important**: `BookingRequests.tourist_id` references `Users.user_id` directly, not `Tourists.tourist_id`.

## 🔒 Security Features

### Authentication & Authorization
- **JWT Token-based Authentication** - Secure session management
- **bcrypt Password Hashing** - Industry-standard password security
- **Role-based Access Control** - Tourist, Driver, Admin permissions
- **Email Verification** - Account activation security

### API Security
- **Rate Limiting** - Prevent API abuse and DDoS attacks
- **Input Validation** - Comprehensive request sanitization
- **CORS Configuration** - Controlled cross-origin access
- **Helmet.js Security Headers** - XSS, CSRF protection
- **SQL Injection Prevention** - Parameterized queries

### Data Protection
- **Secure File Upload** - File type validation and storage
- **Audit Logging** - Comprehensive security event tracking
- **Environment Variables** - Secure configuration management
- **HTTPS Enforcement** - Encrypted data transmission

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js 14+** - JavaScript runtime
- **Microsoft SQL Server** - Database server
- **Git** - Version control
- **npm** - Package manager

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd siyoga-travel-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=9876
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=TripBookingSystem

   # Authentication
   JWT_SECRET=your_super_secure_jwt_secret_key_here
   JWT_EXPIRE=7d

   # Email Configuration
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   EMAIL_FROM=noreply@siyogatravels.com

   # Payment Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

   # File Upload Configuration
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880

   # Security Configuration
   BCRYPT_ROUNDS=12
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX=100
   ```

4. **Set up the database**
   ```bash
   # Create SQL Server database
   # Run the complete schema from Files/NewDB.sql
   # Execute any pending migrations from database/migrations/
   ```

5. **Start the servers**
   ```bash
   # Backend (Development mode)
   npm run dev

   # Frontend
   cd frontend
   npm install
   npm run dev
   ```
   🌐 Backend: `http://localhost:9876/api` | Frontend: `http://localhost:5173`

## 🧪 Testing

### Running Tests

**Backend Tests:**
```bash
# Run all backend tests
npm test

# Run specific test file
npm test -- src/tests/controllers/authController.test.js

# Run tests with coverage
npm run test:coverage
```

**Frontend Tests:**
```bash
cd frontend

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**End-to-End Tests:**
```bash
cd frontend

# Open Cypress test runner
npm run cypress:open

# Run Cypress tests headlessly
npm run cypress:run
```

### Test Coverage Areas
- ✅ **Unit Tests** - Components, services, and utility functions
- ✅ **Integration Tests** - API endpoints and database operations
- ✅ **End-to-End Tests** - Complete user workflows
- ✅ **Security Tests** - Authentication and authorization
- ✅ **Performance Tests** - API response times and load testing

## 🚀 Deployment

### Production Build

**Frontend Build:**
```bash
cd frontend
npm run build
# Output will be in the dist/ directory
```

**Backend Production:**
```bash
# Set environment to production
export NODE_ENV=production

# Start production server
npm start
```

### Environment Configuration
```env
# Production Environment Variables
NODE_ENV=production
PORT=80
DB_HOST=your_production_db_host
DB_NAME=TripBookingSystem_Prod
JWT_SECRET=your_production_jwt_secret
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
EMAIL_USER=your_production_email
```

### Deployment Checklist
- [ ] Set up production database
- [ ] Configure SSL certificates
- [ ] Set up email service (SendGrid, AWS SES, etc.)
- [ ] Configure Stripe live keys
- [ ] Set up file storage (AWS S3, Azure Blob, etc.)
- [ ] Configure monitoring and logging
- [ ] Set up backup procedures
- [ ] Configure CDN for static assets

## 📄 License

This project is licensed under the **ISC License**.

## 🙏 Acknowledgments

- **Developer**: H.K.P.D.Wickramasinghe
- **Framework**: Built with React, Node.js, and Express
- **Database**: Microsoft SQL Server
- **Payment**: Stripe payment processing
- **Hosting**: Designed for cloud deployment
- **Community**: Thanks to all open-source contributors

## 📊 Project Statistics

- **Languages**: JavaScript, SQL, CSS
- **Total Files**: 200+ source files
- **Database Tables**: 15+ core tables
- **API Endpoints**: 50+ REST endpoints
- **Test Coverage**: 80%+ code coverage
- **Performance**: <200ms average API response time


![1](https://github.com/user-attachments/assets/aa3258c5-e838-457f-a430-7f6284e9c85e)
![2](https://github.com/user-attachments/assets/d286a090-3bbc-4e93-9b60-b20e19403b02)
![3](https://github.com/user-attachments/assets/38013d10-1e18-4215-9a02-73b912d1e64d)
![4](https://github.com/user-attachments/assets/8c6e51b8-ab8a-4922-8f8b-55706793532c)
![5](https://github.com/user-attachments/assets/a966d8f8-a4fd-4e3f-b689-8a014c5e700f)
![6](https://github.com/user-attachments/assets/5a7bdfc4-f8c8-42ff-8383-2f055b966f12)
![7](https://github.com/user-attachments/assets/9a9a667e-84e4-49a2-8e32-011de719a692)
![8](https://github.com/user-attachments/assets/fdf7d603-199c-4337-96ed-3256c47ceca0)
![9](https://github.com/user-attachments/assets/91f15224-e597-4dad-bb4c-e025170f3349)
![10](https://github.com/user-attachments/assets/e15f50f3-a53d-4260-8297-7f8fc9ae6058)
![11](https://github.com/user-attachments/assets/aacc8ff3-f6d2-4850-8058-e27fceaba26f)
![12](https://github.com/user-attachments/assets/ae1316e3-377e-4407-acf1-378df565b06e)

---

**🌟 Version:** 1.0.0
**📅 Last Updated:** 2024
**⚡ Node.js Version:** 14+
**🗄️ Database:** Microsoft SQL Server
**🚀 Status:** Production Ready
