import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function TouristRegister() {
  const navigate = useNavigate();
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

  // State for profile picture preview
  const [profilePreview, setProfilePreview] = useState(null);

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to format phone number
  const formatPhoneNumber = (phoneNumber, isEmergencyContact = false) => {
    // Allow digits, +, -, spaces, and parentheses
    let formatted = phoneNumber.replace(/[^\d+\-\s()]/g, '');

    // Limit to 15 characters for phone number or 20 for emergency contact
    // International phone numbers can be up to 15 digits plus country code
    const maxLength = isEmergencyContact ? 20 : 15;
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength);
    }

    return formatted;
  };



  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      // Handle file upload for profile picture
      const file = files[0];
      if (file) {
        // Create a preview URL for the image
        const previewUrl = URL.createObjectURL(file);
        setProfilePreview(previewUrl);

        // Store the file in formData
        setFormData({
          ...formData,
          profilePicture: file
        });
      }
    } else if (name === 'phoneNumber' || name === 'emergencyContactPhone') {
      // Format phone numbers
      const isEmergency = name === 'emergencyContactPhone';
      const formattedValue = formatPhoneNumber(value, isEmergency);

      setFormData({
        ...formData,
        [name]: formattedValue
      });
    } else if (name === 'dateOfBirth') {
      // Special handling for date of birth to ensure YYYY-MM-DD format
      console.log(`Date input changed: ${value}`);

      // If user is typing and hasn't completed the date, don't format yet
      if (value.length < 10) {
        console.log(`Date input incomplete (${value.length} chars), not formatting yet`);
        setFormData({
          ...formData,
          [name]: value
        });
      } else {
        // Check if it's already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          console.log(`Date is already in YYYY-MM-DD format: ${value}`);
          setFormData({
            ...formData,
            [name]: value
          });
        }
        // Check if it's in MM/DD/YYYY format
        else if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          const [month, day, year] = value.split('/');
          const formatted = `${year}-${month}-${day}`;
          console.log(`Converted MM/DD/YYYY to YYYY-MM-DD: ${value} -> ${formatted}`);
          setFormData({
            ...formData,
            [name]: formatted
          });
        }
        // Try to parse as Date object
        else {
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const formatted = `${year}-${month}-${day}`;
              console.log(`Parsed date and formatted to YYYY-MM-DD: ${value} -> ${formatted}`);
              setFormData({
                ...formData,
                [name]: formatted
              });
            } else {
              console.log(`Failed to parse date: ${value}, keeping as is`);
              setFormData({
                ...formData,
                [name]: value
              });
            }
          } catch (error) {
            console.error(`Error parsing date: ${value}`, error);
            setFormData({
              ...formData,
              [name]: value
            });
          }
        }
      }

      // Clear any previous date format errors when the user changes the date
      if (formErrors.dateOfBirth) {
        setFormErrors({
          ...formErrors,
          dateOfBirth: null
        });
      }
    } else {
      // Handle other form fields
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }

    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]*$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Phone number can only contain digits, +, -, spaces, and parentheses';
    } else {
      // Remove all non-digit characters for length check
      const digitsOnly = formData.phoneNumber.replace(/\D/g, '');

      // Check if the phone number is too long (more than 15 digits)
      if (digitsOnly.length > 15) {
        errors.phoneNumber = 'Phone number is too long (maximum 15 digits)';
      }

      // Check if the phone number is too short
      if (digitsOnly.length < 7) {
        errors.phoneNumber = 'Phone number is too short (minimum 7 digits)';
      }
    }

    if (!formData.country.trim()) {
      errors.country = 'Country is required';
    }

    // Date of birth validation
    if (formData.dateOfBirth) {
      try {
        // First check if the format is correct
        if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth)) {
          errors.dateOfBirth = 'Invalid date format for date of birth. Please use YYYY-MM-DD format (e.g., 2000-01-31)';
          console.error(`Invalid date format: ${formData.dateOfBirth}`);
        } else {
          // Format is correct, now check if the date is valid
          const [year, month, day] = formData.dateOfBirth.split('-').map(Number);
          const dob = new Date(year, month - 1, day); // month is 0-indexed in JS Date

          const today = new Date();

          // Check if date components are valid
          if (
            isNaN(dob.getTime()) ||
            dob.getFullYear() !== year ||
            dob.getMonth() !== month - 1 ||
            dob.getDate() !== day
          ) {
            errors.dateOfBirth = 'Please enter a valid date of birth';
            console.error(`Invalid date components: ${year}-${month}-${day}`);
          }
          // Check if date is in the future
          else if (dob > today) {
            errors.dateOfBirth = 'Date of birth cannot be in the future';
          }
          // Check if date is too far in the past
          else {
            const maxAge = 120;
            const minDate = new Date();
            minDate.setFullYear(today.getFullYear() - maxAge);

            if (dob < minDate) {
              errors.dateOfBirth = 'Please enter a valid date of birth (not older than 120 years)';
            }
          }
        }
      } catch (error) {
        console.error("Date validation error:", error);
        errors.dateOfBirth = 'Please enter a valid date of birth in YYYY-MM-DD format';
      }
    }

    if (formData.emergencyContactPhone && !formData.emergencyContactName) {
      errors.emergencyContactName = 'Emergency contact name is required if phone is provided';
    }

    if (formData.emergencyContactName && !formData.emergencyContactPhone) {
      errors.emergencyContactPhone = 'Emergency contact phone is required if name is provided';
    } else if (formData.emergencyContactPhone && !/^[0-9+\-\s()]*$/.test(formData.emergencyContactPhone)) {
      errors.emergencyContactPhone = 'Phone number can only contain digits, +, -, spaces, and parentheses';
    } else if (formData.emergencyContactPhone) {
      // Remove all non-digit characters for length check
      const digitsOnly = formData.emergencyContactPhone.replace(/\D/g, '');

      // Check if the phone number is too long (more than 15 digits)
      if (digitsOnly.length > 15) {
        errors.emergencyContactPhone = 'Emergency contact phone is too long (maximum 15 digits)';
      }

      // Check if the phone number is too short
      if (digitsOnly.length < 7) {
        errors.emergencyContactPhone = 'Emergency contact phone is too short (minimum 7 digits)';
      }
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    return errors;
  };

  // Debug function to test date formatting
  const testDateFormat = (dateString) => {
    console.log("=== DATE FORMAT TEST ===");
    console.log(`Original date string: "${dateString}"`);

    // Test YYYY-MM-DD regex
    const isYYYYMMDD = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
    console.log(`Is YYYY-MM-DD format: ${isYYYYMMDD}`);

    // Test MM/DD/YYYY regex
    const isMMDDYYYY = /^\d{2}\/\d{2}\/\d{4}$/.test(dateString);
    console.log(`Is MM/DD/YYYY format: ${isMMDDYYYY}`);

    // Try parsing as Date
    try {
      const date = new Date(dateString);
      console.log(`Parsed as Date: ${!isNaN(date.getTime()) ? 'Valid' : 'Invalid'}`);
      if (!isNaN(date.getTime())) {
        console.log(`Year: ${date.getFullYear()}, Month: ${date.getMonth() + 1}, Day: ${date.getDate()}`);
      }
    } catch (error) {
      console.error("Error parsing date:", error);
    }

    console.log("=== END TEST ===");
  };

  // Function to check if the backend server is running
  const checkServerStatus = async () => {
    try {
      console.log("Checking server status...");
      const response = await fetch('http://localhost:5000/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Set a timeout to avoid waiting too long
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        console.log("Server is running");
        return true;
      } else {
        console.error("Server returned error:", response.status);
        return false;
      }
    } catch (error) {
      console.error("Server check failed:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setFormErrors({});

    // Test date format if provided
    if (formData.dateOfBirth) {
      testDateFormat(formData.dateOfBirth);
    }

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors);
      setFormErrors(errors);
      // Show error at the bottom of the form
      window.scrollTo(0, document.body.scrollHeight);
      return; // Stop form submission if there are errors
    }

    // Check if the server is running before submitting
    const isServerRunning = await checkServerStatus();
    if (!isServerRunning) {
      setFormErrors({
        submit: 'Failed to connect to the server. Please try again later.'
      });
      window.scrollTo(0, document.body.scrollHeight);
      return;
    }

    // Format date of birth to YYYY-MM-DD format if it exists
    let formattedData = { ...formData };
    if (formData.dateOfBirth) {
      console.log(`Preparing date for submission: ${formData.dateOfBirth}`);

      try {
        // First, check if it's already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth)) {
          console.log(`Date is already in YYYY-MM-DD format: ${formData.dateOfBirth}`);
          formattedData.dateOfBirth = formData.dateOfBirth;
        }
        // If it's in MM/DD/YYYY format, convert it
        else if (/^\d{2}\/\d{2}\/\d{4}$/.test(formData.dateOfBirth)) {
          const [month, day, year] = formData.dateOfBirth.split('/');
          formattedData.dateOfBirth = `${year}-${month}-${day}`;
          console.log(`Converted MM/DD/YYYY to YYYY-MM-DD: ${formData.dateOfBirth} -> ${formattedData.dateOfBirth}`);
        }
        // Otherwise try to parse it as a Date object
        else {
          const date = new Date(formData.dateOfBirth);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            formattedData.dateOfBirth = `${year}-${month}-${day}`;
            console.log(`Parsed date and formatted to YYYY-MM-DD: ${formData.dateOfBirth} -> ${formattedData.dateOfBirth}`);
          } else {
            console.error(`Failed to parse date: ${formData.dateOfBirth}`);
            throw new Error('Invalid date format');
          }
        }

        // Final validation check
        if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedData.dateOfBirth)) {
          console.error(`Final date format validation failed: ${formattedData.dateOfBirth}`);
          throw new Error('Date format is not YYYY-MM-DD');
        }

        // Validate that the date components are valid
        const [year, month, day] = formattedData.dateOfBirth.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (
          date.getFullYear() !== year ||
          date.getMonth() !== month - 1 ||
          date.getDate() !== day
        ) {
          console.error(`Invalid date components: ${year}-${month}-${day}`);
          throw new Error('Invalid date components');
        }

        console.log(`Final validated date for submission: ${formattedData.dateOfBirth}`);
      } catch (error) {
        console.error("Error formatting date:", error);
        setFormErrors({
          ...formErrors,
          dateOfBirth: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2000-01-31).'
        });
        return;
      }
    }

    // Ensure phone numbers are properly formatted
    if (formattedData.phoneNumber) {
      formattedData.phoneNumber = formattedData.phoneNumber.trim();
    }

    if (formattedData.emergencyContactPhone) {
      formattedData.emergencyContactPhone = formattedData.emergencyContactPhone.trim();
    }

    console.log("Submitting form data:", formattedData);
    setIsSubmitting(true);

    try {
      // If we have a profile picture, we need to use FormData instead of JSON
      if (formData.profilePicture) {
        const formDataToSend = new FormData();

        // Add all form fields to FormData using the formatted data
        formDataToSend.append('name', formattedData.name);
        formDataToSend.append('email', formattedData.email);
        formDataToSend.append('password', formattedData.password);
        formDataToSend.append('phoneNumber', formattedData.phoneNumber);
        formDataToSend.append('country', formattedData.country);

        if (formattedData.dateOfBirth) {
          formDataToSend.append('dateOfBirth', formattedData.dateOfBirth);
        }

        if (formattedData.gender) {
          formDataToSend.append('gender', formattedData.gender);
        }

        formDataToSend.append('preferredLanguage', formattedData.preferredLanguage || 'English');

        if (formattedData.emergencyContactName) {
          formDataToSend.append('emergencyContactName', formattedData.emergencyContactName);
        }

        if (formattedData.emergencyContactPhone) {
          formDataToSend.append('emergencyContactPhone', formattedData.emergencyContactPhone);
        }

        // Add profile picture
        formDataToSend.append('profilePicture', formattedData.profilePicture);

        // Add travel preferences as JSON string
        if (formattedData.travelPreferences && formattedData.travelPreferences.length > 0) {
          formDataToSend.append('travelPreferences', JSON.stringify(formattedData.travelPreferences));
        }

        // Make API call with FormData
        let response;
        try {
          console.log('Sending FormData request to API...');
          response = await fetch('http://localhost:5000/api/auth/register/tourist', {
            method: 'POST',
            body: formDataToSend,
            // Don't set Content-Type header, browser will set it with boundary for FormData
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('API error response:', errorData);
            throw new Error(errorData.message || 'Registration failed');
          }
        } catch (fetchError) {
          console.error('Fetch error details:', fetchError);
          if (fetchError.name === 'TypeError' && fetchError.message === 'Failed to fetch') {
            throw new Error('Failed to connect to the server. Please check your internet connection or try again later.');
          }
          throw fetchError;
        }

        const data = await response.json();

        // Show success message and redirect to verification page
        setFormErrors({});
        setIsSubmitting(false);

        // Show success message with toast or alert
        alert(data.message || 'Registration successful! Please check your email to verify your account.');

        // Redirect to login page
        navigate('/login');
      } else {
        // If no profile picture, use JSON as before
        let response;
        try {
          console.log('Sending JSON request to API...');
          const requestBody = {
            name: formattedData.name,
            email: formattedData.email,
            password: formattedData.password,
            phoneNumber: formattedData.phoneNumber,
            country: formattedData.country,
            dateOfBirth: formattedData.dateOfBirth || null,
            gender: formattedData.gender || null,
            preferredLanguage: formattedData.preferredLanguage || 'English',
            emergencyContactName: formattedData.emergencyContactName || null,
            emergencyContactPhone: formattedData.emergencyContactPhone || null,
            travelPreferences: formattedData.travelPreferences && formattedData.travelPreferences.length > 0 ?
              JSON.stringify(formattedData.travelPreferences) : null
          };

          console.log('Request payload:', requestBody);

          response = await fetch('http://localhost:5000/api/auth/register/tourist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('API error response:', errorData);
            throw new Error(errorData.message || 'Registration failed');
          }
        } catch (fetchError) {
          console.error('Fetch error details:', fetchError);
          if (fetchError.name === 'TypeError' && fetchError.message === 'Failed to fetch') {
            throw new Error('Failed to connect to the server. Please check your internet connection or try again later.');
          }
          throw fetchError;
        }

        const data = await response.json();

        // Show success message and redirect to verification page
        setFormErrors({});
        setIsSubmitting(false);

        // Show success message with toast or alert
        alert(data.message || 'Registration successful! Please check your email to verify your account.');

        // Redirect to login page
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);

      // Clear any previous server-side errors
      const newErrors = { ...formErrors };
      delete newErrors.submit;

      // Check if it's a network error
      if (error.message.includes('Failed to connect')) {
        newErrors.submit = error.message;
        setIsSubmitting(false);
        setFormErrors(newErrors);
        window.scrollTo(0, document.body.scrollHeight);
        return;
      }

      // Check if the error message indicates a validation error
      if (error.message.includes('Invalid data format')) {
        // This is likely a validation error from the server
        // Set a more specific error message
        newErrors.submit = 'Please check all fields for errors. Make sure your phone number is not too long and your date of birth is valid.';

        // Check for specific field errors
        if (error.message.includes('phone')) {
          newErrors.phoneNumber = 'Phone number format is invalid. Use only digits, +, -, spaces, and parentheses.';
        }

        if (error.message.includes('date of birth') || error.message.includes('dateOfBirth')) {
          newErrors.dateOfBirth = 'Date of birth is invalid. Please use YYYY-MM-DD format.';
        }

        if (error.message.includes('emergency contact')) {
          newErrors.emergencyContactPhone = 'Emergency contact phone format is invalid.';
        }
      } else {
        // For other errors, use the error message
        newErrors.submit = error.message || 'Registration failed. Please try again.';
      }

      // Scroll to show the error
      window.scrollTo(0, document.body.scrollHeight);
      setFormErrors(newErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="Siyoga Travels Logo"
            className="h-16 w-auto mb-4"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join Siyoga Travels to discover beautiful destinations in Sri Lanka
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg border border-gray-100 rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>
            </div>

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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>
            </div>

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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>
            </div>

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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>

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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {formErrors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>
                )}
              </div>
            </div>

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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                {formErrors.country && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.country}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                Date of Birth (YYYY-MM-DD format)
              </label>
              <div className="mt-1">
                <div className="relative">
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="text"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="YYYY-MM-DD"
                    pattern="\d{4}-\d{2}-\d{2}"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <small className="text-gray-500 font-bold">Format: YYYY-MM-DD (e.g., 2000-01-31)</small>
                <div className="mt-1 text-xs text-blue-600">
                  <strong>Important:</strong> Please enter the date in YYYY-MM-DD format only.
                </div>
                {formErrors.dateOfBirth ? (
                  <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                      </svg>
                      {formErrors.dateOfBirth}
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      Please enter the date in YYYY-MM-DD format (e.g., 2000-01-31 instead of 01/31/2000)
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {formErrors.gender && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.gender}</p>
                )}
              </div>
            </div>

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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                {formErrors.preferredLanguage && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.preferredLanguage}</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-lg font-medium text-gray-900">Emergency Contact (Optional)</h3>
              <p className="mt-1 text-sm text-gray-500">
                In case of emergency during your travels
              </p>
            </div>

            <div>
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {formErrors.emergencyContactName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.emergencyContactName}</p>
                )}
              </div>
            </div>

            <div>
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {formErrors.emergencyContactPhone && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.emergencyContactPhone}</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-lg font-medium text-gray-900">Profile Picture (Optional)</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload a profile picture to personalize your account
              </p>
            </div>

            <div>
              <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">
                Profile Picture
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              {formErrors.profilePicture && (
                <p className="mt-1 text-sm text-red-600">{formErrors.profilePicture}</p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-lg font-medium text-gray-900">Travel Preferences (Optional)</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select your travel preferences to help us personalize your experience
              </p>
            </div>

            <div>
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700">
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
                        onChange={(e) => {
                          const value = e.target.value;
                          const isChecked = e.target.checked;

                          // Update travel preferences
                          const updatedPreferences = isChecked
                            ? [...formData.travelPreferences, value]
                            : formData.travelPreferences.filter(pref => pref !== value);

                          setFormData({
                            ...formData,
                            travelPreferences: updatedPreferences,
                          });

                          // Clear any travel preferences error
                          if (formErrors.travelPreferences) {
                            setFormErrors({
                              ...formErrors,
                              travelPreferences: ''
                            });
                          }
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`preference-${preference}`} className="ml-2 block text-sm text-gray-700">
                        {preference}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Server-side error message */}
            {formErrors.submit && (
              <div className={`p-4 mb-4 text-sm ${formErrors.submit.includes('Failed to connect') ? 'text-orange-700 bg-orange-100 border-orange-200' : 'text-red-700 bg-red-100 border-red-200'} rounded-lg border`} role="alert">
                <div className="flex items-center">
                  {formErrors.submit.includes('Failed to connect') ? (
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                  )}
                  <span className="font-medium">{formErrors.submit}</span>
                </div>

                {formErrors.submit.includes('Failed to connect') && (
                  <div className="mt-2 ml-7">
                    <p className="text-xs text-red-600">
                      <strong>Connection Error:</strong> Please check that the backend server is running at http://localhost:5000
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      <strong>Troubleshooting:</strong>
                      <ol className="list-decimal ml-4 mt-1">
                        <li>Make sure the backend server is running</li>
                        <li>Check for any console errors in the terminal</li>
                        <li>Verify that port 5000 is not blocked by another application</li>
                      </ol>
                    </p>
                  </div>
                )}

                {formErrors.dateOfBirth && (
                  <div className="mt-2 ml-7">
                    <p className="text-xs text-red-600">
                      <strong>Date of Birth Error:</strong> Please enter the date in YYYY-MM-DD format (e.g., 2000-01-31)
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <Link to="/terms-of-service" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy-policy" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {formErrors.agreeToTerms && (
              <p className="mt-1 text-sm text-red-600">{formErrors.agreeToTerms}</p>
            )}

            {formErrors.submit && !Object.keys(formErrors).some(key => key !== 'submit') && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {formErrors.submit}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div>
  <button
    type="submit"
    disabled={isSubmitting}
    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 ${
      isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
    }`}
  >
    {isSubmitting ? (
      <>
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Creating account...
      </>
    ) : (
      'Create account'
    )}
  </button>
</div>

          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our <Link to="/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TouristRegister;