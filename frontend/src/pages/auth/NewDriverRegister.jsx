import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { sendOtp } from '../../services/driverService';

const NewDriverRegister = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    licenseNumber: '',
    gender: '',
    dateOfBirth: '',
    nicNumber: '',
    licenseExpiryDate: '',
    profilePicture: null,
    nicFrontImage: null,
    nicBackImage: null,
    licenseFrontImage: null,
    policeClearanceImage: null,
    agreeToTerms: false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState({
    profilePicture: null,
    nicFrontImage: null,
    nicBackImage: null,
    licenseFrontImage: null,
    policeClearanceImage: null
  });

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle file input changes
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => ({ ...prev, [name]: reader.result }));
      };
      reader.readAsDataURL(files[0]);

      // Clear error if exists
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));

    // Clear error when user checks
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Enhanced form validation
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    // Email validation
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone number validation
    if (!formData.phoneNumber || !formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid phone number (10-15 digits)';
    }

    // License number validation
    if (!formData.licenseNumber || !formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
    } else if (formData.licenseNumber.trim().length > 50) {
      newErrors.licenseNumber = 'License number must be less than 50 characters';
    }

    // NIC number validation
    if (!formData.nicNumber || !formData.nicNumber.trim()) {
      newErrors.nicNumber = 'NIC number is required';
    } else if (formData.nicNumber.trim().length > 20) {
      newErrors.nicNumber = 'NIC number must be less than 20 characters';
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    // Date of birth validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();

      if (isNaN(birthDate.getTime())) {
        newErrors.dateOfBirth = 'Please enter a valid date';
      } else {
        // Check if the driver is at least 18 years old
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          if (age - 1 < 18) {
            newErrors.dateOfBirth = 'Driver must be at least 18 years old';
          }
        } else if (age < 18) {
          newErrors.dateOfBirth = 'Driver must be at least 18 years old';
        }

        // Check if the date is in the future
        if (birthDate > today) {
          newErrors.dateOfBirth = 'Date of birth cannot be in the future';
        }
      }
    }

    // License expiry date validation
    if (!formData.licenseExpiryDate) {
      newErrors.licenseExpiryDate = 'License expiry date is required';
    } else {
      const expiryDate = new Date(formData.licenseExpiryDate);
      const today = new Date();

      if (isNaN(expiryDate.getTime())) {
        newErrors.licenseExpiryDate = 'Please enter a valid date';
      } else if (expiryDate <= today) {
        newErrors.licenseExpiryDate = 'License expiry date must be in the future';
      }
    }

    // Required images validation
    if (!formData.nicFrontImage) {
      newErrors.nicFrontImage = 'NIC front image is required';
    }

    if (!formData.nicBackImage) {
      newErrors.nicBackImage = 'NIC back image is required';
    }

    if (!formData.licenseFrontImage) {
      newErrors.licenseFrontImage = 'License front image is required';
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);

    try {
      // Format dates for consistency
      const formatDate = (dateString) => {
        if (!dateString) return '';

        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return dateString;

          return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        } catch (error) {
          console.error('Error formatting date:', error);
          return dateString;
        }
      };

      // Store registration data in session storage
      // Include both camelCase and snake_case versions for compatibility
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        // CamelCase versions (for frontend)
        phoneNumber: formData.phoneNumber,
        licenseNumber: formData.licenseNumber,
        gender: formData.gender,
        dateOfBirth: formatDate(formData.dateOfBirth),
        nicNumber: formData.nicNumber,
        licenseExpiryDate: formatDate(formData.licenseExpiryDate),
        // Snake_case versions (for backend)
        phone_number: formData.phoneNumber,
        license_number: formData.licenseNumber,
        // gender is the same
        date_of_birth: formatDate(formData.dateOfBirth),
        nic_number: formData.nicNumber,
        license_expiry_date: formatDate(formData.licenseExpiryDate),
        // We can't store file objects in session storage, so we'll handle them separately
        hasProfilePicture: !!formData.profilePicture,
        hasNicFrontImage: !!formData.nicFrontImage,
        hasNicBackImage: !!formData.nicBackImage,
        hasLicenseFrontImage: !!formData.licenseFrontImage,
        hasPoliceClearanceImage: !!formData.policeClearanceImage,
        // Add a flag to indicate this is a new registration
        isNewRegistration: true
      };

      // Store registration data in session storage
      sessionStorage.setItem('driverRegistrationData', JSON.stringify(registrationData));

      // Store images in session storage as base64
      if (formData.profilePicture) {
        sessionStorage.setItem('driverProfilePicture', previewImages.profilePicture);
      }

      if (formData.nicFrontImage) {
        sessionStorage.setItem('driverNicFrontImage', previewImages.nicFrontImage);
      }

      if (formData.nicBackImage) {
        sessionStorage.setItem('driverNicBackImage', previewImages.nicBackImage);
      }

      if (formData.licenseFrontImage) {
        sessionStorage.setItem('driverLicenseFrontImage', previewImages.licenseFrontImage);
      }

      if (formData.policeClearanceImage) {
        sessionStorage.setItem('driverPoliceClearanceImage', previewImages.policeClearanceImage);
      }

      // Send OTP to email for verification
      const otpResponse = await sendOtp(formData.email);

      if (otpResponse.success) {
        toast.success('Verification code sent to your email');

        // Navigate to OTP verification page
        navigate('/verify-driver-otp', {
          state: {
            email: formData.email
          }
        });
      } else {
        toast.error('Failed to send verification code. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);

      // Check if the error is related to email already registered
      if (error.message && error.message.includes('already registered')) {
        setErrors(prev => ({ ...prev, email: 'Email already registered. Please use a different email or try to log in.' }));
        toast.error('Email already registered. Please use a different email or try to log in.');
      } else {
        toast.error(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Register as a Driver</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your account
            </Link>
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Required fields notice */}
          <div className="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  All fields marked with * are required. Please ensure all documents are clear and valid.
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Personal Information Section */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>

              {/* Full Name */}
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address *
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div className="mb-4">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <div className="mt-1">
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="+1 (123) 456-7890"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div className="mb-4">
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender *
                </label>
                <div className="mt-1">
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                  )}
                </div>
              </div>

              {/* Date of Birth */}
              <div className="mb-4">
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                  Date of Birth *
                </label>
                <div className="mt-1">
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Identification Section */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Identification</h3>

              {/* NIC Number */}
              <div className="mb-4">
                <label htmlFor="nicNumber" className="block text-sm font-medium text-gray-700">
                  NIC Number *
                </label>
                <div className="mt-1">
                  <input
                    id="nicNumber"
                    name="nicNumber"
                    type="text"
                    required
                    value={formData.nicNumber}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your NIC number"
                  />
                  {errors.nicNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.nicNumber}</p>
                  )}
                </div>
              </div>

              {/* NIC Front Image */}
              <div className="mb-4">
                <label htmlFor="nicFrontImage" className="block text-sm font-medium text-gray-700">
                  NIC Front Image *
                </label>
                <div className="mt-1">
                  <input
                    id="nicFrontImage"
                    name="nicFrontImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.nicFrontImage && (
                    <p className="mt-1 text-sm text-red-600">{errors.nicFrontImage}</p>
                  )}
                  {previewImages.nicFrontImage && (
                    <div className="mt-2">
                      <img src={previewImages.nicFrontImage} alt="NIC front preview" className="h-32 object-cover rounded-md" />
                    </div>
                  )}
                </div>
              </div>

              {/* NIC Back Image */}
              <div className="mb-4">
                <label htmlFor="nicBackImage" className="block text-sm font-medium text-gray-700">
                  NIC Back Image *
                </label>
                <div className="mt-1">
                  <input
                    id="nicBackImage"
                    name="nicBackImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.nicBackImage && (
                    <p className="mt-1 text-sm text-red-600">{errors.nicBackImage}</p>
                  )}
                  {previewImages.nicBackImage && (
                    <div className="mt-2">
                      <img src={previewImages.nicBackImage} alt="NIC back preview" className="h-32 object-cover rounded-md" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Driver License Section */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Driver License</h3>

              {/* License Number */}
              <div className="mb-4">
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                  License Number *
                </label>
                <div className="mt-1">
                  <input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    required
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your license number"
                  />
                  {errors.licenseNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>
                  )}
                </div>
              </div>

              {/* License Expiry Date */}
              <div className="mb-4">
                <label htmlFor="licenseExpiryDate" className="block text-sm font-medium text-gray-700">
                  License Expiry Date *
                </label>
                <div className="mt-1">
                  <input
                    id="licenseExpiryDate"
                    name="licenseExpiryDate"
                    type="date"
                    required
                    value={formData.licenseExpiryDate}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.licenseExpiryDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.licenseExpiryDate}</p>
                  )}
                </div>
              </div>

              {/* License Front Image */}
              <div className="mb-4">
                <label htmlFor="licenseFrontImage" className="block text-sm font-medium text-gray-700">
                  License Front Image *
                </label>
                <div className="mt-1">
                  <input
                    id="licenseFrontImage"
                    name="licenseFrontImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.licenseFrontImage && (
                    <p className="mt-1 text-sm text-red-600">{errors.licenseFrontImage}</p>
                  )}
                  {previewImages.licenseFrontImage && (
                    <div className="mt-2">
                      <img src={previewImages.licenseFrontImage} alt="License front preview" className="h-32 object-cover rounded-md" />
                    </div>
                  )}
                </div>
              </div>

              {/* Police Clearance Image (Optional) */}
              <div className="mb-4">
                <label htmlFor="policeClearanceImage" className="block text-sm font-medium text-gray-700">
                  Police Clearance Image (Optional)
                </label>
                <div className="mt-1">
                  <input
                    id="policeClearanceImage"
                    name="policeClearanceImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.policeClearanceImage && (
                    <p className="mt-1 text-sm text-red-600">{errors.policeClearanceImage}</p>
                  )}
                  {previewImages.policeClearanceImage && (
                    <div className="mt-2">
                      <img src={previewImages.policeClearanceImage} alt="Police clearance preview" className="h-32 object-cover rounded-md" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Picture Section */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile</h3>

              {/* Profile Picture */}
              <div className="mb-4">
                <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">
                  Profile Picture (Optional)
                </label>
                <div className="mt-1">
                  <input
                    id="profilePicture"
                    name="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.profilePicture && (
                    <p className="mt-1 text-sm text-red-600">{errors.profilePicture}</p>
                  )}
                  {previewImages.profilePicture && (
                    <div className="mt-2">
                      <img src={previewImages.profilePicture} alt="Profile preview" className="h-24 w-24 object-cover rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account</h3>

              {/* Password */}
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Create a password"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
              </div>

              {/* Confirm Password */}
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="mb-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={handleCheckboxChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                      I agree to the terms and conditions *
                    </label>
                    {errors.agreeToTerms && (
                      <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Register as Driver'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Want to register as a tourist?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register/tourist/new"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100"
              >
                Register as Tourist Instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDriverRegister;
