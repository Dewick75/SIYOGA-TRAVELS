# Siyoga Travel System - Testing Guide

This document provides information about the test suite for the Siyoga Travel System, focusing on the tourist registration functionality.

## Test Structure

The test suite is organized as follows:

### Frontend Tests

1. **UI Component Tests** - Located in `frontend/src/tests/pages/auth/TouristRegister.test.jsx`
   - Tests the TouristRegister component rendering and functionality
   - Validates form inputs, error handling, and submission

2. **End-to-End Tests** - Located in `frontend/src/tests/e2e/touristRegistration.test.js`
   - Uses Cypress to test the full registration flow
   - Simulates user interactions and API responses

### Backend Tests

1. **Controller Tests** - Located in `backend/src/tests/controllers/authController.test.js`
   - Tests the registerTourist controller function
   - Validates input handling, error cases, and successful registration

2. **Route Tests** - Located in `backend/src/tests/routes/authRoutes.test.js`
   - Tests the auth routes for registration, verification, and login
   - Ensures proper routing and response handling

3. **Integration Tests** - Located in `backend/src/tests/integration/touristRegistration.test.js`
   - Tests the full API flow for tourist registration
   - Validates the interaction between routes, controllers, and database

## Running the Tests

### Frontend Tests

To run the frontend tests:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies if not already installed
npm install

# Run Jest tests
npm test

# Run specific test file
npm test -- src/tests/pages/auth/TouristRegister.test.jsx

# Run E2E tests with Cypress
npm run cypress:open
# Then select touristRegistration.test.js from the Cypress UI
```

### Backend Tests

To run the backend tests:

```bash
# Navigate to the backend directory
cd backend

# Install dependencies if not already installed
npm install

# Run all tests
npm test

# Run specific test file
npm test -- src/tests/controllers/authController.test.js
```

## Test Coverage

The test suite aims to cover:

1. **Form Validation**
   - Required fields
   - Email format
   - Password strength and matching
   - Phone number format
   - Date of birth validation
   - Gender validation

2. **API Validation**
   - Input validation
   - Error handling
   - Database interactions
   - Email verification

3. **User Flow**
   - Registration process
   - Error messages
   - Success messages
   - Redirection

## Adding New Tests

When adding new features to the tourist registration process, please follow these guidelines:

1. Create unit tests for any new components or functions
2. Update existing tests if you modify existing functionality
3. Add integration tests for new API endpoints
4. Update E2E tests to cover the new user flows

## Mocking

The tests use various mocking strategies:

1. **API Mocks** - Using Jest's `jest.fn()` and `mockImplementation()`
2. **Database Mocks** - Mocking the database queries to avoid actual database connections
3. **External Services** - Mocking email services, verification services, etc.
4. **Browser APIs** - Mocking `localStorage`, `fetch`, etc.

## Troubleshooting

If tests are failing, check the following:

1. Ensure all dependencies are installed
2. Check that environment variables are properly set in the test setup files
3. Verify that mocks are correctly implemented
4. Check for changes in component structure or API contracts

For more help, contact the development team.
