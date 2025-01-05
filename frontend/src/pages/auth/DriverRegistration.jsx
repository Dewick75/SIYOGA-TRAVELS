import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function DriverRegister() {
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
    profilePicture: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profilePicture: file });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);

      // Clear error if exists
      if (errors.profilePicture) {
        setErrors({ ...errors, profilePicture: '' });
      }
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid phone number (10-15 digits)';
    }

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'Driver license number is required';
    } else if (formData.licenseNumber.trim().length > 50) {
      newErrors.licenseNumber = 'License number must be less than 50 characters';
    }

    if (!formData.nicNumber.trim()) {
      newErrors.nicNumber = 'NIC number is required';
    } else if (formData.nicNumber.trim().length > 20) {
      newErrors.nicNumber = 'NIC number must be less than 20 characters';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    } else if (!['Male', 'Female', 'Other'].includes(formData.gender)) {
      newErrors.gender = 'Please select a valid gender option';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      // Check if the date is valid
      const birthDate = new Date(formData.dateOfBirth);

      if (isNaN(birthDate.getTime())) {
        newErrors.dateOfBirth = 'Please enter a valid date';
      } else {
        // Check if the driver is at least 18 years old
        const today = new Date();
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

    return newErrors;
  };

  // Helper function to check if all required fields are filled
  const checkRequiredFields = () => {
    const requiredFields = {
      name: 'Full Name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      phoneNumber: 'Phone Number',
      licenseNumber: 'License Number',
      nicNumber: 'NIC Number',
      gender: 'Gender',
      dateOfBirth: 'Date of Birth'
    };

    const missingFields = [];

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        missingFields.push(label);
      }
    });

    return missingFields;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Double-check required fields
    const missingFields = checkRequiredFields();
    if (missingFields.length > 0) {
      setSubmitError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      // Helper function to format date to YYYY-MM-DD
      const formatDate = (dateString) => {
        if (!dateString) return '';

        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return dateString; // Return as is if invalid

          // Format as YYYY-MM-DD
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');

          return `${year}-${month}-${day}`;
        } catch (error) {
          console.error('Error formatting date:', error);
          return dateString; // Return original on error
        }
      };

      // Format the date of birth
      const formattedDateOfBirth = formatDate(formData.dateOfBirth);
      console.log('Formatted date of birth:', formattedDateOfBirth);

      // Create form data for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('licenseNumber', formData.licenseNumber);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('dateOfBirth', formattedDateOfBirth);
      formDataToSend.append('nicNumber', formData.nicNumber);

      if (formData.profilePicture) {
        formDataToSend.append('profilePicture', formData.profilePicture);
      }

      // Make API call to register driver
      console.log('Sending driver registration data:', {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        licenseNumber: formData.licenseNumber,
        gender: formData.gender,
        dateOfBirth: formattedDateOfBirth, // Use the formatted date
        nicNumber: formData.nicNumber,
        hasProfilePicture: !!formData.profilePicture
      });

      const response = await fetch('http://localhost:9876/api/auth/register/driver', {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration error response:', errorData);
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();

      if (data.success) {
        // Show success message
        const successMessage = data.message || 'Registration successful! Please check your email to verify your account.';
        toast.success(successMessage, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        console.log('Registration successful:', data);

        // Show alert before redirecting
        alert('Registration successful! You will be redirected to the login page. Please check your email to verify your account.');

        // Redirect to login page
        navigate('/login');
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);

      // Provide more detailed error message
      let errorMessage = error.message || 'Registration failed. Please try again.';

      // Check for specific error types
      if (errorMessage.includes('database')) {
        errorMessage = 'Database connection error. Please try again later or contact support.';
      } else if (errorMessage.includes('email')) {
        errorMessage = 'Email error: ' + errorMessage;
      } else if (errorMessage.includes('NULL')) {
        // Handle missing required fields
        if (errorMessage.includes('nic_number')) {
          errorMessage = 'NIC number is required and cannot be empty.';
        } else if (errorMessage.includes('phone_number')) {
          errorMessage = 'Phone number is required and cannot be empty.';
        } else if (errorMessage.includes('license_number')) {
          errorMessage = 'License number is required and cannot be empty.';
        } else {
          errorMessage = 'A required field is missing. Please fill in all required fields.';
        }
      } else if (errorMessage.includes('truncated')) {
        errorMessage = 'One of your inputs is too long. Please check the length of your entries.';
      } else if (errorMessage.includes('format')) {
        // More specific error message for date format issues
        if (errorMessage.includes('date')) {
          errorMessage = 'Invalid date format. Please enter the date in YYYY-MM-DD format.';
        } else {
          errorMessage = 'Invalid data format. Please check your inputs and try again.';
        }
      } else if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
        // For email already registered, provide a link to login
        errorMessage = 'This email is already registered. Please try to login instead.';
        // Show login link
        setTimeout(() => {
          navigate('/login');
        }, 3000); // Redirect after 3 seconds
      } else {
        // For any other errors, provide a more user-friendly message
        errorMessage = 'Registration failed: ' + errorMessage;
      }

      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Register as a Driver
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to your account
            </Link>
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {submitError && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              </div>
            </div>
          )}

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
                  All fields marked with * are required. Please ensure your NIC number, license number, and phone number are entered correctly.
                </p>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            </div>

            <div>
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="+1 (123) 456-7890"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                Driver License Number *
              </label>
              <div className="mt-1">
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  required
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your license number"
                />
                {errors.licenseNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>
                )}
              </div>
            </div>

            <div>
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your NIC number"
                />
                {errors.nicNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.nicNumber}</p>
                )}
              </div>
            </div>

            <div>
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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

            <div>
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                )}
              </div>
            </div>

            <div>
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Create a password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            <div>
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.profilePicture && (
                  <p className="mt-1 text-sm text-red-600">{errors.profilePicture}</p>
                )}
                {previewImage && (
                  <div className="mt-2">
                    <img src={previewImage} alt="Profile preview" className="h-24 w-24 object-cover rounded-full" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {loading ? 'Registering...' : 'Register as Driver'}
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
                to="/register/tourist"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100"
              >
                Register as Tourist Instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverRegister;