import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // State for verification message from registration
  const [verificationMessage, setVerificationMessage] = useState('');

  // Get the redirect path from location state or default to a fallback
  const from = location.state?.from?.pathname || '/destinations';

  // Check for verification message from registration
  useEffect(() => {
    if (location.state?.message) {
      setVerificationMessage(location.state.message);
      // Pre-fill email if provided
      if (location.state.email) {
        setFormData(prev => ({ ...prev, email: location.state.email }));
      }
    }
  }, [location.state]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

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

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Attempting to login with:', formData.email);

      // Make an actual API call to login with retry mechanism
      let response;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          console.log(`Login attempt ${retryCount + 1}/${maxRetries + 1} for: ${formData.email}`);

          response = await fetch('http://localhost:9876/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password
            }),
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });

          console.log('Login response status:', response.status);

          // If we got a response, break out of the retry loop
          break;
        } catch (fetchError) {
          console.error(`Fetch error on attempt ${retryCount + 1}:`, fetchError);

          // If we've reached max retries, throw the error
          if (retryCount >= maxRetries) {
            throw new Error('Network error: Unable to connect to the server. Please check your connection and try again.');
          }

          // Wait before retrying (1 second, then 2 seconds)
          const waitTime = 1000 * (retryCount + 1);
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));

          retryCount++;
        }
      }

      // Always parse the response body, whether it's an error or success
      let data;
      try {
        data = await response.json();
        console.log('Login response data:', data);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server. Please try again later.');
      }

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 500) {
          throw new Error('Server error: The system is currently experiencing issues. Please try again later.');
        } else if (response.status === 503) {
          throw new Error('Service unavailable: The server is temporarily unable to handle the request.');
        } else {
          throw new Error(data.message || 'Invalid database request');
        }
      }

      if (data.success) {
        // Create user data object from response
        const userData = {
          id: data.data.userId,
          name: data.data.name,
          email: data.data.email,
          role: data.data.role.toLowerCase(), // Convert to lowercase to match frontend expectations
          token: data.data.token
        };

        // Store token separately
        localStorage.setItem('token', data.data.token);

        // Login using auth context
        const success = await login(userData);

        if (success) {
          // Determine redirect based on user role
          let redirectTo = '/destinations'; // Default for tourists

          if (userData.role === 'driver') {
            redirectTo = '/driver/dashboard';
          } else if (userData.role === 'admin') {
            redirectTo = '/admin/dashboard';
          }

          // Navigate to appropriate page
          navigate(from === '/' ? redirectTo : from, { replace: true });
        } else {
          setFormErrors({
            submit: 'Login failed: Unable to authenticate user.'
          });
        }
      } else {
        setFormErrors({
          submit: 'Login failed: ' + (data.message || 'Unknown error')
        });
      }
    } catch (error) {
      console.error('Login error:', error);

      // Check if the error is related to email verification
      if (error.message && error.message.includes('Email not verified')) {
        setFormErrors({
          submit: error.message,
          verification: true
        });
      } else if (error.message && error.message.includes('Invalid database request') ||
                 error.message && error.message.includes('Database connection error') ||
                 error.message && error.message.includes('database query failed') ||
                 error.message && error.message.includes('Server error')) {
        // Show a more user-friendly database error message with troubleshooting tips
        setFormErrors({
          submit: 'Database connection error. The system is currently experiencing technical difficulties connecting to the database.',
          isDbError: true,
          dbTroubleshooting: true
        });

        // Log the specific error for debugging
        console.error('Database error details:', error);
      } else if (error.message && error.message.includes('Invalid credentials')) {
        setFormErrors({
          submit: 'Invalid email or password. Please check your credentials.'
        });
      } else if (error.message && error.message.includes('Network error')) {
        setFormErrors({
          submit: 'Network error: Unable to connect to the server. Please check your internet connection and try again.',
          isNetworkError: true
        });
      } else if (error.message && error.message.includes('timeout')) {
        setFormErrors({
          submit: 'Request timeout: The server took too long to respond. Please try again later.',
          isNetworkError: true
        });
      } else {
        setFormErrors({
          submit: error.message || 'Login failed. Please try again.'
        });
      }
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
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back to Siyoga Travels
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg border border-gray-100 rounded-lg sm:px-10">
          {verificationMessage && (
            <div className="mb-4 rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">{verificationMessage}</p>
                </div>
              </div>
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            {formErrors.submit && (
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
                    {formErrors.verification && (
                      <div className="mt-2">
                        <Link
                          to={`/verify-email?resend=${encodeURIComponent(formData.email)}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                          Resend verification email
                        </Link>
                      </div>
                    )}
                    {(formErrors.isDbError || formErrors.isNetworkError) && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Clear errors and retry
                            setFormErrors({});
                            handleSubmit({ preventDefault: () => {} });
                          }}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center"
                        >
                          <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Retry connection
                        </button>
                      </div>
                    )}

                    {formErrors.dbTroubleshooting && (
                      <div className="mt-3 text-xs text-red-700 bg-red-50 p-2 rounded">
                        <p className="font-semibold mb-1">Troubleshooting:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Make sure SQL Server is running</li>
                          <li>Check that the database exists</li>
                          <li>Verify server configuration</li>
                          <li>Contact administrator if problem persists</li>
                        </ul>
                        <p className="mt-1 italic">For demo purposes, you can still use the demo accounts below.</p>
                      </div>
                    )}
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
        Signing in...
      </>
    ) : (
      'Sign in'
    )}
  </button>
</div>


            {/* Demo Login Info */}
            <div className="mt-4 bg-blue-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Demo Accounts</h3>
              <div className="text-xs text-blue-800">
                <p className="mb-1"><strong>Tourist:</strong> tourist@example.com / password</p>
                <p className="mb-1"><strong>Driver:</strong> driver@example.com / password</p>
                <p><strong>Admin:</strong> admin@example.com / password</p>
              </div>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or
                </span>
              </div>
            </div>

            <div className="mt-6">
              <div>
                <a
                  href="#"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                  Sign in with Twitter
                </a>
              </div>

              <div className="mt-3">
                <a
                  href="#"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                  </svg>
                  Sign in with Google
                </a>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register/tourist/new" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign up as Tourist
                </Link>
                {' or '}
                <Link to="/register/driver" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign up as Driver
                </Link>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <Link to="/admin/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Register as Admin
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;