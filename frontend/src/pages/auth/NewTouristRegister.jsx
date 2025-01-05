import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { sendOtp } from '../../services/touristService';

const NewTouristRegister = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    country: '',
    dateOfBirth: '',
    gender: '',
    preferredLanguage: 'English',
    emergencyContactName: '',
    emergencyContactPhone: '',
    profilePicture: null,
    travelPreferences: [],
    agreeToTerms: false
  });

  // Error state
  const [errors, setErrors] = useState({});

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Profile picture preview
  const [profilePreview, setProfilePreview] = useState(null);

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      // Handle file upload
      if (files && files[0]) {
        const file = files[0];
        setFormData(prev => ({ ...prev, profilePicture: file }));

        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else if (name === 'phoneNumber' || name === 'emergencyContactPhone') {
      // Only allow digits for phone numbers
      const digitsOnly = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: digitsOnly }));
    } else if (type === 'checkbox' && name === 'travelPreferences') {
      // Handle travel preferences checkboxes
      const updatedPreferences = checked
        ? [...formData.travelPreferences, value]
        : formData.travelPreferences.filter(pref => pref !== value);

      setFormData(prev => ({ ...prev, travelPreferences: updatedPreferences }));
    } else {
      // Handle other inputs
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [formData, errors]);

  // Enhanced form validation
  const validateForm = () => {
    const newErrors = {};

    // Name validation with more detailed checks
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    // Email validation with more robust regex
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Password validation with more checks
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (formData.password.length > 50) {
      newErrors.password = 'Password must be less than 50 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone number validation with better error messages
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must contain only digits (no spaces or special characters)';
    } else if (formData.phoneNumber.length < 7 || formData.phoneNumber.length > 15) {
      newErrors.phoneNumber = 'Phone number must be between 7 and 15 digits';
    }

    // Country validation
    if (!formData.country) {
      newErrors.country = 'Please select your country';
    }

    // Date of birth validation with more comprehensive checks
    if (formData.dateOfBirth) {
      try {
        const date = new Date(formData.dateOfBirth);
        if (isNaN(date.getTime())) {
          newErrors.dateOfBirth = 'Invalid date format';
        } else {
          // Check if date is in the future
          if (date > new Date()) {
            newErrors.dateOfBirth = 'Date of birth cannot be in the future';
          }

          // Check if user is too old (e.g., over 120 years)
          const maxAge = new Date();
          maxAge.setFullYear(maxAge.getFullYear() - 120);
          if (date < maxAge) {
            newErrors.dateOfBirth = 'Please enter a valid date of birth';
          }
        }
      } catch {
        newErrors.dateOfBirth = 'Invalid date format';
      }
    }

    // Emergency contact validation with clearer messages
    if (formData.emergencyContactName && !formData.emergencyContactPhone) {
      newErrors.emergencyContactPhone = 'Please provide an emergency contact phone number';
    }

    if (formData.emergencyContactPhone && !formData.emergencyContactName) {
      newErrors.emergencyContactName = 'Please provide an emergency contact name';
    }

    // Emergency contact phone validation
    if (formData.emergencyContactPhone) {
      if (!/^\d+$/.test(formData.emergencyContactPhone)) {
        newErrors.emergencyContactPhone = 'Emergency contact phone must contain only digits';
      } else if (formData.emergencyContactPhone.length < 7 || formData.emergencyContactPhone.length > 15) {
        newErrors.emergencyContactPhone = 'Emergency contact phone must be between 7 and 15 digits';
      }
    }

    // Terms agreement
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions to continue';
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData object for file upload
      const formDataToSend = new FormData();

      // Add all form fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('country', formData.country);

      if (formData.dateOfBirth) {
        formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      }

      if (formData.gender) {
        formDataToSend.append('gender', formData.gender);
      }

      formDataToSend.append('preferredLanguage', formData.preferredLanguage);

      if (formData.emergencyContactName) {
        formDataToSend.append('emergencyContactName', formData.emergencyContactName);
      }

      if (formData.emergencyContactPhone) {
        formDataToSend.append('emergencyContactPhone', formData.emergencyContactPhone);
      }

      if (formData.profilePicture) {
        formDataToSend.append('profilePicture', formData.profilePicture);
      }

      if (formData.travelPreferences.length > 0) {
        formDataToSend.append('travelPreferences', JSON.stringify(formData.travelPreferences));
      }

      // Log form data for debugging
      console.log('Form data being sent:', {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        country: formData.country,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        // Don't log password for security reasons
      });

      try {
        // Send OTP to email for verification
        const otpResponse = await sendOtp(formData.email);

        if (otpResponse.success) {
          toast.success('Verification code sent to your email!');

          // Create a serializable object with the form data
          // We can't pass FormData directly as it's not serializable
          const serializableData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phoneNumber: formData.phoneNumber,
            country: formData.country,
            dateOfBirth: formData.dateOfBirth || '',
            gender: formData.gender || '',
            preferredLanguage: formData.preferredLanguage,
            emergencyContactName: formData.emergencyContactName || '',
            emergencyContactPhone: formData.emergencyContactPhone || '',
            travelPreferences: formData.travelPreferences || [],
            // Note: We can't pass the profile picture through navigation state
            // We'll handle it separately in the OTP verification component
            hasProfilePicture: !!formData.profilePicture
          };

          // Store the form data in session storage temporarily
          // This is a workaround for the FormData object which can't be passed directly
          sessionStorage.setItem('touristRegistrationData', JSON.stringify(serializableData));

          // If there's a profile picture, store it in session storage as base64
          if (formData.profilePicture) {
            const reader = new FileReader();
            reader.onloadend = () => {
              // Store the profile picture data URL in session storage
              sessionStorage.setItem('touristProfilePicture', reader.result);

              // Navigate to OTP verification page with email
              navigate('/verify-otp', {
                state: {
                  email: formData.email
                }
              });
            };
            reader.readAsDataURL(formData.profilePicture);
          } else {
            // Navigate to OTP verification page with email
            navigate('/verify-otp', {
              state: {
                email: formData.email
              }
            });
          }
        } else {
          toast.error('Failed to send verification code. Please try again.');
        }
      } catch (serviceError) {
        console.error('Service error:', serviceError);

        // Check if the error is related to email already registered
        if (serviceError.message.includes('already registered')) {
          setErrors(prev => ({ ...prev, email: 'Email already registered. Please use a different email or try to log in.' }));
          toast.error('Email already registered. Please use a different email or try to log in.');
        } else {
          toast.error(serviceError.message || 'Failed to send verification code. Please try again.');
        }

        throw serviceError; // Re-throw to be caught by the outer catch block
      }
    } catch (error) {
      console.error('Registration error:', error);

      // For errors, show the error message
      toast.error(error.message || 'Registration failed. Please try again.');

      // Set specific field errors if available
      if (error.message.includes('email')) {
        setErrors(prev => ({ ...prev, email: 'Email already registered or invalid' }));
      }

      if (error.message.includes('phone')) {
        setErrors(prev => ({ ...prev, phoneNumber: 'Invalid phone number format' }));
      }

      if (error.message.includes('date')) {
        setErrors(prev => ({ ...prev, dateOfBirth: 'Invalid date format' }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join Siyoga Travels to discover beautiful destinations in Sri Lanka
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            </div>

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {/* Confirm Password field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Phone number field */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <div className="mt-1">
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>
            </div>

            {/* Country field */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <div className="mt-1">
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a country</option>
                  <option value="AU">Australia</option>
                  <option value="CA">Canada</option>
                  <option value="CN">China</option>
                  <option value="FR">France</option>
                  <option value="DE">Germany</option>
                  <option value="IN">India</option>
                  <option value="IT">Italy</option>
                  <option value="JP">Japan</option>
                  <option value="RU">Russia</option>
                  <option value="GB">United Kingdom</option>
                  <option value="US">United States</option>
                  <option value="LK">Sri Lanka</option>
                </select>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                )}
              </div>
            </div>

            {/* Date of Birth field */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <div className="mt-1">
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  max={new Date().toISOString().split('T')[0]} // Set max date to today
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                )}
              </div>
            </div>

            {/* Gender field */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Gender
              </label>
              <div className="mt-1">
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                )}
              </div>
            </div>

            {/* Preferred Language field */}
            <div>
              <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700">
                Preferred Language
              </label>
              <div className="mt-1">
                <select
                  id="preferredLanguage"
                  name="preferredLanguage"
                  value={formData.preferredLanguage}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="English">English</option>
                  <option value="Sinhala">Sinhala</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Hindi">Hindi</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Japanese">Japanese</option>
                </select>
                {errors.preferredLanguage && (
                  <p className="mt-1 text-sm text-red-600">{errors.preferredLanguage}</p>
                )}
              </div>
            </div>

            {/* Emergency Contact section */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900">Emergency Contact (Optional)</h3>

              {/* Emergency Contact Name */}
              <div className="mt-4">
                <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
                  Emergency Contact Name
                </label>
                <div className="mt-1">
                  <input
                    id="emergencyContactName"
                    name="emergencyContactName"
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.emergencyContactName && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName}</p>
                  )}
                </div>
              </div>

              {/* Emergency Contact Phone */}
              <div className="mt-4">
                <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">
                  Emergency Contact Phone
                </label>
                <div className="mt-1">
                  <input
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.emergencyContactPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Picture section */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900">Profile Picture (Optional)</h3>
              <div className="mt-4">
                <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">
                  Upload a profile picture
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  {profilePreview && (
                    <div className="flex-shrink-0">
                      <img
                        src={profilePreview}
                        alt="Profile preview"
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    </div>
                  )}
                  <input
                    id="profilePicture"
                    name="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                {errors.profilePicture && (
                  <p className="mt-1 text-sm text-red-600">{errors.profilePicture}</p>
                )}
              </div>
            </div>

            {/* Travel Preferences section */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900">Travel Preferences (Optional)</h3>
              <div className="mt-4">
                <fieldset>
                  <legend className="text-sm font-medium text-gray-700">
                    What type of travel do you prefer?
                  </legend>
                  <div className="mt-2 space-y-2">
                    {['Adventure', 'Beach', 'Cultural', 'Food', 'Luxury', 'Nature', 'Urban'].map((preference) => (
                      <div key={preference} className="flex items-center">
                        <input
                          id={`preference-${preference}`}
                          name="travelPreferences"
                          type="checkbox"
                          value={preference}
                          checked={formData.travelPreferences.includes(preference)}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`preference-${preference}`} className="ml-3 text-sm text-gray-700">
                          {preference}
                        </label>
                      </div>
                    ))}
                  </div>
                </fieldset>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
                I agree to the <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
            )}

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </div>

            {/* Login link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewTouristRegister;
