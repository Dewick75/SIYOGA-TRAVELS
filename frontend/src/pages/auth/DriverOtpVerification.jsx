import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { verifyOtp, sendOtp, registerDriver } from '../../services/driverService';

// Helper function to convert data URI to Blob
const dataURItoBlob = (dataURI) => {
  try {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
  } catch (error) {
    console.error('Error converting data URI to Blob:', error);
    return null;
  }
};

const DriverOtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState('');
  const [userData, setUserData] = useState(null);

  // Initialize component with email from location state
  useEffect(() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email);

      // Get user data from session storage
      const storedData = sessionStorage.getItem('driverRegistrationData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);

          // Create a new FormData object to send to the server
          const formDataToSend = new FormData();

          // Add all form fields from the stored data
          Object.entries(parsedData).forEach(([key, value]) => {
            // Skip the flags for images and isNewRegistration flag
            if (!key.startsWith('has') && key !== 'isNewRegistration') {
              // Handle arrays if needed
              if (Array.isArray(value)) {
                formDataToSend.append(key, JSON.stringify(value));
              } else if (value !== null && value !== undefined && value !== '') {
                // Only append non-empty values
                formDataToSend.append(key, value);
                console.log(`Added field ${key}: ${key === 'password' ? '[REDACTED]' : value}`);
              }
            }
          });

          // Ensure we have the required fields in snake_case format
          const requiredSnakeCaseFields = ['phone_number', 'license_number', 'nic_number'];

          requiredSnakeCaseFields.forEach(field => {
            if (!formDataToSend.has(field)) {
              // Try to get from camelCase version
              const camelCaseField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
              if (formDataToSend.has(camelCaseField)) {
                formDataToSend.append(field, formDataToSend.get(camelCaseField));
                console.log(`Added missing snake_case field ${field} from ${camelCaseField}`);
              }
            }
          });

          // Log the form data before adding images
          console.log('Form data before adding images:');
          for (let pair of formDataToSend.entries()) {
            console.log(`${pair[0]}: ${pair[0] === 'password' ? '[REDACTED]' : pair[1]}`);
          }

          // Add images from session storage if they exist
          const addImageToFormData = (imageKey, storageKey, fileName) => {
            if (parsedData[`has${imageKey}`]) {
              const imageData = sessionStorage.getItem(storageKey);
              if (imageData) {
                try {
                  // Convert base64 to blob
                  const blob = dataURItoBlob(imageData);
                  if (blob) {
                    // Use both camelCase and snake_case field names for better compatibility
                    // First, keep the original camelCase field name
                    const camelCaseFieldName = imageKey.charAt(0).toLowerCase() + imageKey.slice(1);

                    // Also create the snake_case version
                    const snakeCaseFieldName = imageKey
                      .replace(/([A-Z])/g, '_$1')
                      .toLowerCase()
                      .replace(/^_/, '');

                    // Add both versions to ensure compatibility
                    formDataToSend.append(camelCaseFieldName, blob, fileName);
                    formDataToSend.append(snakeCaseFieldName, blob, fileName);

                    console.log(`Added ${imageKey} as both ${camelCaseFieldName} and ${snakeCaseFieldName}: ${blob.size} bytes, type: ${blob.type}`);
                    return true;
                  } else {
                    console.error(`Failed to convert ${imageKey} to blob`);
                  }
                } catch (error) {
                  console.error(`Error processing ${imageKey}:`, error);
                }
              } else {
                console.error(`${imageKey} data not found in session storage`);
              }
            }
            return false;
          };

          // Add all required images - using both camelCase and snake_case field names
          // First try with camelCase (original implementation)
          const profilePictureAdded = addImageToFormData('ProfilePicture', 'driverProfilePicture', 'profile.jpg');
          const nicFrontAdded = addImageToFormData('NicFrontImage', 'driverNicFrontImage', 'nic_front.jpg');
          const nicBackAdded = addImageToFormData('NicBackImage', 'driverNicBackImage', 'nic_back.jpg');
          const licenseFrontAdded = addImageToFormData('LicenseFrontImage', 'driverLicenseFrontImage', 'license_front.jpg');
          const policeClearanceAdded = addImageToFormData('PoliceClearanceImage', 'driverPoliceClearanceImage', 'police_clearance.jpg');

          // Log the status of image uploads
          console.log(`Image upload status:
            profilePicture: ${profilePictureAdded ? 'Added' : 'Not added'}
            nicFrontImage: ${nicFrontAdded ? 'Added' : 'Not added'}
            nicBackImage: ${nicBackAdded ? 'Added' : 'Not added'}
            licenseFrontImage: ${licenseFrontAdded ? 'Added' : 'Not added'}
            policeClearanceImage: ${policeClearanceAdded ? 'Added' : 'Not added'}
          `);

          // Check if required images were added
          if (!nicFrontAdded || !nicBackAdded || !licenseFrontAdded) {
            console.error('Required images are missing from form data');
            toast.error('Required document images are missing. Please try registering again.');

            // Clean up session storage
            sessionStorage.removeItem('driverRegistrationData');
            sessionStorage.removeItem('driverProfilePicture');
            sessionStorage.removeItem('driverNicFrontImage');
            sessionStorage.removeItem('driverNicBackImage');
            sessionStorage.removeItem('driverLicenseFrontImage');
            sessionStorage.removeItem('driverPoliceClearanceImage');

            navigate('/register/driver/new');
            return;
          }

          // Log the form data after adding images
          console.log('Form data after adding images:');
          for (let pair of formDataToSend.entries()) {
            if (pair[1] instanceof Blob) {
              console.log(`${pair[0]}: [Blob ${pair[1].size} bytes, type: ${pair[1].type}]`);
            } else if (pair[0] === 'password') {
              console.log(`${pair[0]}: [REDACTED]`);
            } else {
              console.log(`${pair[0]}: ${pair[1]}`);
            }
          }

          // Set the form data
          setUserData(formDataToSend);
          console.log('Driver registration data loaded successfully');
        } catch (error) {
          console.error('Error parsing stored registration data:', error);
          toast.error('Error retrieving registration data. Please try again.');
          navigate('/register/driver/new');
        }
      } else {
        // If no user data is found, redirect to registration page
        toast.error('Registration data is missing. Please try registering again.');
        navigate('/register/driver/new');
      }
    } else {
      // If no email is provided, redirect to registration page
      toast.error('Email information is missing. Please try registering again.');
      navigate('/register/driver/new');
    }
  }, [location, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input field if current field is filled
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // Handle key press for backspace
  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace if current field is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  // Handle OTP verification
  const handleVerify = async (e) => {
    e.preventDefault();

    const otpValue = otp.join('');

    // Validate OTP
    if (otpValue.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      // First, check if we have user data
      if (!userData) {
        toast.error('User data is missing. Please try registering again.');
        sessionStorage.removeItem('driverRegistrationData');
        sessionStorage.removeItem('driverProfilePicture');
        sessionStorage.removeItem('driverNicFrontImage');
        sessionStorage.removeItem('driverNicBackImage');
        sessionStorage.removeItem('driverLicenseFrontImage');
        sessionStorage.removeItem('driverPoliceClearanceImage');
        navigate('/register/driver/new');
        return;
      }

      // Log the form data being sent for debugging
      console.log('Form data being sent to registration API:');
      for (let pair of userData.entries()) {
        console.log(pair[0] + ': ' + (pair[0] === 'password' ? '[REDACTED]' : pair[1]));
      }

      // Make sure required fields are present - using snake_case for backend compatibility
      const requiredFields = ['name', 'email', 'password', 'phone_number', 'license_number', 'nic_number'];
      let missingFields = [];

      // First check if we have the camelCase versions from the form
      const camelCaseFields = {
        'phone_number': 'phoneNumber',
        'license_number': 'licenseNumber',
        'nic_number': 'nicNumber'
      };

      for (const field of requiredFields) {
        // Check if the field exists directly
        if (userData.get(field)) {
          continue;
        }

        // If not, check if we have a camelCase version
        const camelCaseField = camelCaseFields[field];
        if (camelCaseField && userData.get(camelCaseField)) {
          // Add the snake_case version with the value from camelCase
          userData.append(field, userData.get(camelCaseField));
          console.log(`Converted ${camelCaseField} to ${field}`);
          continue;
        }

        // If we still don't have the field, mark it as missing
        missingFields.push(field);
      }

      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Remove any unexpected fields that might cause issues
      // Use snake_case field names to match backend expectations
      const validFields = [
        'name', 'email', 'password', 'phone_number', 'license_number', 'gender',
        'date_of_birth', 'nic_number', 'license_expiry_date', 'profile_picture',
        'nic_front_image', 'nic_back_image', 'license_front_image', 'police_clearance_image'
      ];

      // Create a new FormData with only valid fields
      const cleanedFormData = new FormData();

      // Log all fields in userData for debugging
      console.log('All fields in userData:');
      for (let pair of userData.entries()) {
        console.log(`${pair[0]}: ${pair[0] === 'password' ? '[REDACTED]' : (pair[1] instanceof Blob ? `[Blob ${pair[1].size} bytes]` : pair[1])}`);
      }

      // Add all valid fields to the cleaned form data
      for (const field of validFields) {
        const value = userData.get(field);
        if (value !== null && value !== undefined) {
          // For file fields, ensure we're using the correct field name and file object
          if (field === 'profile_picture' ||
              field === 'nic_front_image' ||
              field === 'nic_back_image' ||
              field === 'license_front_image' ||
              field === 'police_clearance_image') {

            if (value instanceof Blob) {
              // Generate a filename for the blob if it doesn't have one
              const fileName = field + '.' + (value.type.split('/')[1] || 'jpg');
              cleanedFormData.append(field, value, fileName);
              console.log(`Added ${field} as Blob with filename ${fileName}`);
            } else {
              // Check if we have the file in camelCase format
              const camelCaseField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
              const camelCaseValue = userData.get(camelCaseField);

              if (camelCaseValue instanceof Blob) {
                const fileName = field + '.' + (camelCaseValue.type.split('/')[1] || 'jpg');
                cleanedFormData.append(field, camelCaseValue, fileName);
                console.log(`Added ${field} from camelCase field ${camelCaseField} with filename ${fileName}`);
              } else {
                console.log(`No blob found for ${field} or ${camelCaseField}`);
              }
            }
          } else {
            cleanedFormData.append(field, value);
            console.log(`Added field ${field}: ${field === 'password' ? '[REDACTED]' : value}`);
          }
        }
      }

      // Use the cleaned form data instead of the original userData
      const finalFormData = cleanedFormData;

      // Log the final form data for debugging
      console.log('Final form data fields:');
      for (let pair of finalFormData.entries()) {
        console.log(`${pair[0]}: ${pair[0] === 'password' ? '[REDACTED]' : (pair[1] instanceof Blob ? `[Blob ${pair[1].size} bytes]` : pair[1])}`);
      }

      try {
        // 1. First register the user
        console.log('Sending registration data to server...');
        const registerResponse = await registerDriver(finalFormData);
        console.log('Registration response received:', registerResponse);

        // 2. Then verify the OTP
        const verifyResponse = await verifyOtp(email, otpValue);

        if (verifyResponse.success) {
          toast.success('Email verified successfully!');

          // 3. Handle successful registration and verification
          toast.success('Registration successful! You can now log in.');

          // Clean up session storage
          sessionStorage.removeItem('driverRegistrationData');
          sessionStorage.removeItem('driverProfilePicture');
          sessionStorage.removeItem('driverNicFrontImage');
          sessionStorage.removeItem('driverNicBackImage');
          sessionStorage.removeItem('driverLicenseFrontImage');
          sessionStorage.removeItem('driverPoliceClearanceImage');

          // Redirect to login page
          navigate('/login', {
            state: {
              message: 'Registration successful! You can now log in. After verification, your account will be pending approval by admin.',
              email
            }
          });
        } else {
          // OTP verification failed, but user is registered
          toast.warning('Registration completed, but email verification failed. You can verify your email later.');

          // Clean up session storage
          sessionStorage.removeItem('driverRegistrationData');
          sessionStorage.removeItem('driverProfilePicture');
          sessionStorage.removeItem('driverNicFrontImage');
          sessionStorage.removeItem('driverNicBackImage');
          sessionStorage.removeItem('driverLicenseFrontImage');
          sessionStorage.removeItem('driverPoliceClearanceImage');

          // Redirect to login page
          navigate('/login', {
            state: {
              message: 'Registration completed. Please verify your email before logging in.',
              email
            }
          });
        }
      } catch (error) {
        console.error('Error during driver registration or verification:', error);

        // Check if the error message suggests the registration might have succeeded
        if (error.message && (
            error.message.includes('Registration appears to have succeeded') ||
            error.message.includes('already registered')
        )) {
          // This is a special case where we think registration succeeded despite the error

          // Try to verify the OTP anyway
          try {
            const verifyResponse = await verifyOtp(email, otpValue);
            if (verifyResponse.success) {
              toast.success('Email verified successfully!');
            }
          } catch (verifyError) {
            console.error('Error verifying OTP after registration:', verifyError);
          }

          toast.success('Registration completed! Please check your email for verification.');

          // Clean up session storage
          sessionStorage.removeItem('driverRegistrationData');
          sessionStorage.removeItem('driverProfilePicture');
          sessionStorage.removeItem('driverNicFrontImage');
          sessionStorage.removeItem('driverNicBackImage');
          sessionStorage.removeItem('driverLicenseFrontImage');
          sessionStorage.removeItem('driverPoliceClearanceImage');

          // Redirect to login page
          navigate('/login', {
            state: {
              message: 'Registration completed! Please check your email for verification.',
              email
            }
          });
        } else {
          // Regular error handling
          // Clean up session storage
          sessionStorage.removeItem('driverRegistrationData');
          sessionStorage.removeItem('driverProfilePicture');
          sessionStorage.removeItem('driverNicFrontImage');
          sessionStorage.removeItem('driverNicBackImage');
          sessionStorage.removeItem('driverLicenseFrontImage');
          sessionStorage.removeItem('driverPoliceClearanceImage');

          toast.error(error.message || 'Registration failed. Please try again.');
          navigate('/register/driver/new');
        }
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'Failed to verify OTP. Please try again.');

      // Clean up session storage
      sessionStorage.removeItem('driverRegistrationData');
      sessionStorage.removeItem('driverProfilePicture');
      sessionStorage.removeItem('driverNicFrontImage');
      sessionStorage.removeItem('driverNicBackImage');
      sessionStorage.removeItem('driverLicenseFrontImage');
      sessionStorage.removeItem('driverPoliceClearanceImage');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);

    try {
      // Call service to resend OTP
      const response = await sendOtp(email);

      if (response.success) {
        toast.success('OTP sent successfully!');
        setCountdown(60);
        setCanResend(false);
      } else {
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Verify Your Email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We've sent a 6-digit code to {email}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleVerify}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Enter verification code
              </label>
              <div className="mt-1 flex justify-between">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="appearance-none block w-12 h-12 text-center px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-lg"
                  />
                ))}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              Didn't receive the code?{' '}
              <button
                onClick={handleResendOtp}
                disabled={!canResend || isLoading}
                className={`font-medium ${
                  canResend ? 'text-blue-600 hover:text-blue-500 cursor-pointer' : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
              </button>
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register/driver/new"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Start Over
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverOtpVerification;
