import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { verifyOtp, sendOtp, registerTourist } from '../../services/touristService';

const OtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState('');
  const [userData, setUserData] = useState(null);

  // Get email from location state and user data from session storage
  useEffect(() => {
    // Get email from location state
    if (location.state && location.state.email) {
      setEmail(location.state.email);

      // Get user data from session storage
      const storedData = sessionStorage.getItem('touristRegistrationData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);

          // Create a new FormData object to send to the server
          const formDataToSend = new FormData();

          // Add all form fields from the stored data
          Object.entries(parsedData).forEach(([key, value]) => {
            // Skip the hasProfilePicture flag
            if (key !== 'hasProfilePicture') {
              // Handle arrays (like travelPreferences)
              if (Array.isArray(value)) {
                formDataToSend.append(key, JSON.stringify(value));
              } else if (value !== null && value !== undefined && value !== '') {
                // Only append non-empty values
                formDataToSend.append(key, value);
              }
            }
          });

          // Log the form data for debugging
          console.log('Form data reconstructed from session storage:');
          for (let [key, value] of Object.entries(parsedData)) {
            if (key !== 'hasProfilePicture') {
              console.log(`${key}: ${value}`);
            }
          }

          // Add profile picture if it exists in session storage
          const profilePicture = sessionStorage.getItem('touristProfilePicture');
          if (profilePicture && parsedData.hasProfilePicture) {
            // Convert data URL to Blob
            fetch(profilePicture)
              .then(res => res.blob())
              .then(blob => {
                // Create a File object from the Blob
                const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
                formDataToSend.append('profilePicture', file);

                // Set the form data
                setUserData(formDataToSend);

                // Log success
                console.log('Profile picture added to form data');
              })
              .catch(error => {
                console.error('Error processing profile picture:', error);
                // Still set the form data even if profile picture processing fails
                setUserData(formDataToSend);
              });
          } else {
            // Set the form data without profile picture
            setUserData(formDataToSend);
            console.log('No profile picture to add');
          }
        } catch (error) {
          console.error('Error parsing stored registration data:', error);
          toast.error('Error retrieving registration data. Please try again.');
          navigate('/register/tourist/new');
        }
      } else {
        // If no user data is found, redirect to registration page
        toast.error('Registration data is missing. Please try registering again.');
        navigate('/register/tourist/new');
      }
    } else {
      // If no email is provided, redirect to registration page
      toast.error('Email information is missing. Please try registering again.');
      navigate('/register/tourist/new');
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
      // First, register the user
      if (!userData) {
        toast.error('User data is missing. Please try registering again.');
        sessionStorage.removeItem('touristRegistrationData');
        sessionStorage.removeItem('touristProfilePicture');
        navigate('/register/tourist/new');
        return;
      }

      // Log the form data being sent for debugging
      console.log('Form data being sent to registration API:');
      // Log each entry in the FormData
      for (let pair of userData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      // Make sure required fields are present
      const requiredFields = ['name', 'email', 'password', 'phoneNumber', 'country'];
      let missingFields = [];

      for (const field of requiredFields) {
        if (!userData.get(field)) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      try {
        // 1. First register the user
        const registerResponse = await registerTourist(userData);
        console.log('Registration response received:', registerResponse);

        // 2. Then verify the OTP
        const verifyResponse = await verifyOtp(email, otpValue);

        if (verifyResponse.success) {
          toast.success('Email verified successfully!');

          // 3. Handle successful registration and verification
          toast.success('Registration successful! You can now log in.');

          // Clean up session storage
          sessionStorage.removeItem('touristRegistrationData');
          sessionStorage.removeItem('touristProfilePicture');

          // Redirect to login page
          navigate('/login', {
            state: {
              message: 'Registration successful! You can now log in.',
              email
            }
          });
        } else {
          // OTP verification failed, but user is registered
          toast.warning('Registration completed, but email verification failed. You can verify your email later.');

          // Clean up session storage
          sessionStorage.removeItem('touristRegistrationData');
          sessionStorage.removeItem('touristProfilePicture');

          // Redirect to login page
          navigate('/login', {
            state: {
              message: 'Registration completed. Please verify your email before logging in.',
              email
            }
          });
        }
      } catch (error) {
        console.error('Error during registration or verification:', error);

        // Clean up session storage
        sessionStorage.removeItem('touristRegistrationData');
        sessionStorage.removeItem('touristProfilePicture');

        toast.error(error.message || 'Registration failed. Please try again.');
        navigate('/register/tourist/new');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'Failed to verify OTP. Please try again.');

      // Clean up session storage
      sessionStorage.removeItem('touristRegistrationData');
      sessionStorage.removeItem('touristProfilePicture');
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
            <p className="text-center text-sm text-gray-600">
              <Link to="/register/tourist/new" className="font-medium text-blue-600 hover:text-blue-500">
                Back to Registration
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;
