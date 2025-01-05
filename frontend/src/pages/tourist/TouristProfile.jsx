import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePicture from '../../components/ProfilePicture';

function TouristProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    country: '',
    dateOfBirth: '',
    gender: '',
    preferredLanguage: 'English',
    emergencyContactName: '',
    emergencyContactPhone: '',
    travelPreferences: [],
    profilePicture: null,
    password: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State for profile picture preview
  const [profilePreview, setProfilePreview] = useState(null);

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');


  useEffect(() => {
    // Get user info from localStorage
    const userJson = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userJson || !token) {
      // Redirect to login if no user found
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(userJson);
      setUser(userData);

      // Fetch complete profile data from API
      const fetchProfileData = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/tourists/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch profile data');
          }

          const data = await response.json();

          if (data.success && data.data) {
            const profileData = data.data;

            // If there's a profile picture, set the preview
            if (profileData.ProfilePicture) {
              // Handle different profile picture path formats
              let picturePath = profileData.ProfilePicture;

              // If it's NULL or empty string in the database
              if (!picturePath || picturePath === 'NULL') {
                console.log("No profile picture found");
              } else {
                // Set a timestamp to prevent caching
                const timestamp = new Date().getTime();

                // Use the full URL to the uploads directory
                // The path is already stored with the subdirectory in the database
                const fullPath = `http://localhost:5000/uploads/${picturePath}?t=${timestamp}`;
                console.log("Setting profile picture preview:", fullPath);

                // Set the preview immediately to avoid blinking
                setProfilePreview(fullPath);

                // Add debug logging to help diagnose image loading issues
                console.log("Profile picture data:", {
                  originalPath: picturePath,
                  fullPath: fullPath,
                  timestamp: timestamp
                });
              }
            }

            // Parse travel preferences if they exist
            let travelPrefs = [];
            if (profileData.TravelPreferences) {
              try {
                travelPrefs = JSON.parse(profileData.TravelPreferences);
              } catch (e) {
                console.error('Failed to parse travel preferences', e);
              }
            }

            // Set form data with all available profile information
            setFormData({
              name: profileData.Name || userData.name || '',
              email: profileData.Email || userData.email || '',
              phoneNumber: profileData.PhoneNumber || '',
              country: profileData.Country || '',
              dateOfBirth: profileData.DateOfBirth ? new Date(profileData.DateOfBirth).toISOString().split('T')[0] : '',
              gender: profileData.Gender || '',
              preferredLanguage: profileData.PreferredLanguage || 'English',
              emergencyContactName: profileData.EmergencyContactName || '',
              emergencyContactPhone: profileData.EmergencyContactPhone || '',
              travelPreferences: travelPrefs,
              password: '',
              newPassword: '',
              confirmPassword: ''
            });
          } else {
            // Fallback to basic user data if API call fails
            setFormData({
              name: userData.name || '',
              email: userData.email || '',
              phoneNumber: '',
              country: '',
              dateOfBirth: '',
              gender: '',
              preferredLanguage: 'English',
              emergencyContactName: '',
              emergencyContactPhone: '',
              travelPreferences: [],
              password: '',
              newPassword: '',
              confirmPassword: ''
            });
          }
        } catch (error) {
          console.error('Error fetching profile data:', error);
          // Fallback to basic user data if API call fails
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phoneNumber: '',
            country: '',
            dateOfBirth: '',
            gender: '',
            preferredLanguage: 'English',
            emergencyContactName: '',
            emergencyContactPhone: '',
            travelPreferences: [],
            password: '',
            newPassword: '',
            confirmPassword: ''
          });
        } finally {
          setLoading(false);
        }
      };

      fetchProfileData();
    } catch (error) {
      console.error('Failed to parse user data', error);
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      // Handle file upload (profile picture)
      if (files && files[0]) {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(files[0].type)) {
          setFormErrors({
            ...formErrors,
            profilePicture: 'Please select a valid image file (JPEG, PNG, GIF, WEBP)'
          });
          return;
        }

        // Validate file size (max 5MB)
        if (files[0].size > 5 * 1024 * 1024) {
          setFormErrors({
            ...formErrors,
            profilePicture: 'Image size should be less than 5MB'
          });
          return;
        }

        setFormData({
          ...formData,
          [name]: files[0]
        });

        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfilePreview(e.target.result);
        };
        reader.readAsDataURL(files[0]);

        // Clear any previous errors
        if (formErrors.profilePicture) {
          setFormErrors({
            ...formErrors,
            profilePicture: ''
          });
        }
      }
    } else if (type === 'checkbox') {
      // Handle checkbox for travel preferences
      if (name === 'travelPreferences') {
        const updatedPreferences = [...formData.travelPreferences];

        if (checked) {
          // Add preference if checked
          if (!updatedPreferences.includes(value)) {
            updatedPreferences.push(value);
          }
        } else {
          // Remove preference if unchecked
          const index = updatedPreferences.indexOf(value);
          if (index !== -1) {
            updatedPreferences.splice(index, 1);
          }
        }

        setFormData({
          ...formData,
          travelPreferences: updatedPreferences
        });
      } else {
        // Handle other checkboxes
        setFormData({
          ...formData,
          [name]: checked
        });
      }
    } else {
      // Handle regular inputs
      setFormData({
        ...formData,
        [name]: value
      });
    }

    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }

    // Clear success message when user starts editing
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = () => {
    const errors = {};

    // Required fields validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    // Phone number validation (optional field)
    if (formData.phoneNumber && !/^\+?[0-9]{10,15}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }

    // Emergency contact phone validation (optional field)
    if (formData.emergencyContactPhone && !/^\+?[0-9]{10,15}$/.test(formData.emergencyContactPhone.replace(/\s/g, ''))) {
      errors.emergencyContactPhone = 'Please enter a valid emergency contact phone number';
    }

    // Password change validation
    if (formData.newPassword || formData.confirmPassword) {
      // Current password is required if trying to set a new password
      if (!formData.password) {
        errors.password = 'Current password is required to set a new password';
      }

      // New password requirements
      if (formData.newPassword && formData.newPassword.length < 8) {
        errors.newPassword = 'New password must be at least 8 characters';
      }

      // Password confirmation must match
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Create FormData object for file upload
      const formDataToSend = new FormData();

      // Add basic profile data
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('preferredLanguage', formData.preferredLanguage);

      if (formData.dateOfBirth) {
        formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      }

      if (formData.gender) {
        formDataToSend.append('gender', formData.gender);
      }

      if (formData.emergencyContactName) {
        formDataToSend.append('emergencyContactName', formData.emergencyContactName);
      }

      if (formData.emergencyContactPhone) {
        formDataToSend.append('emergencyContactPhone', formData.emergencyContactPhone);
      }

      // Add travel preferences as JSON string
      if (formData.travelPreferences && formData.travelPreferences.length > 0) {
        formDataToSend.append('travelPreferences', JSON.stringify(formData.travelPreferences));
      }

      // Add profile picture if present
      if (formData.profilePicture && formData.profilePicture instanceof File) {
        formDataToSend.append('profilePicture', formData.profilePicture);
      }

      // Update profile
      const response = await fetch('http://localhost:5000/api/tourists/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Handle password change if needed
      if (formData.password && formData.newPassword) {
        const passwordResponse = await fetch('http://localhost:5000/api/tourists/change-password', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentPassword: formData.password,
            newPassword: formData.newPassword
          })
        });

        const passwordData = await passwordResponse.json();

        if (!passwordResponse.ok) {
          throw new Error(passwordData.message || 'Failed to update password');
        }

        // Clear password fields after successful update
        setFormData(prevData => ({
          ...prevData,
          password: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }

      // Update user info in localStorage if name was changed
      if (user && user.name !== formData.name) {
        const updatedUser = { ...user, name: formData.name };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      setSuccessMessage('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setFormErrors({
        ...formErrors,
        submit: error.message || 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Travel preference options
  const travelPreferenceOptions = [
    { value: 'Adventure', label: 'Adventure' },
    { value: 'Beach', label: 'Beach' },
    { value: 'Cultural', label: 'Cultural' },
    { value: 'Food', label: 'Food & Culinary' },
    { value: 'Luxury', label: 'Luxury' },
    { value: 'Nature', label: 'Nature & Wildlife' },
    { value: 'Urban', label: 'Urban' }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">Your Profile</h1>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {formErrors.submit && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {formErrors.submit}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {/* Profile Picture Section */}
          <div className="md:w-1/3 bg-gray-50 p-8 flex flex-col items-center">
            <div className="mb-4">
              {/* Add debug info for profile picture URL */}
            
              <ProfilePicture
                src={profilePreview}
                alt={formData.name}
                size="large"
              />
            </div>

            <div className="w-full max-w-xs">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="profilePicture">
                Update Profile Picture
              </label>
              <input
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                id="profilePicture"
                name="profilePicture"
                type="file"
                accept="image/*"
                onChange={handleChange}
              />
              {formErrors.profilePicture && (
                <p className="text-red-500 text-xs mt-1">{formErrors.profilePicture}</p>
              )}
              <p className="text-gray-500 text-xs mt-2">Max file size: 5MB. Supported formats: JPEG, PNG, GIF, WEBP</p>
            </div>
          </div>

          {/* Profile Form Section */}
          <div className="md:w-2/3 p-8">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Basic Information */}
                <div className="col-span-2">
                  <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                    Full Name*
                  </label>
                  <input
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      formErrors.name ? 'border-red-500' : ''
                    }`}
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                    Email*
                  </label>
                  <input
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100 ${
                      formErrors.email ? 'border-red-500' : ''
                    }`}
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Your email"
                    value={formData.email}
                    disabled
                    required
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">Email cannot be changed</p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phoneNumber">
                    Phone Number
                  </label>
                  <input
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      formErrors.phoneNumber ? 'border-red-500' : ''
                    }`}
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="e.g. +94771234567"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                  {formErrors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber}</p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="country">
                    Country
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="country"
                    name="country"
                    type="text"
                    placeholder="Your country"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>

                {/* Date of Birth */}
                // Date of Birth field in the form
<div>
  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
    Date of Birth
  </label>
  <div className="mt-1">
    <input
      id="dateOfBirth"
      name="dateOfBirth"
      type="date" // Enforce HTML date type
      value={formData.dateOfBirth}
      onChange={handleChange}
      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
      max={new Date().toISOString().split('T')[0]} // Set max date to today
    />
    <small className="text-gray-500">Please use the date picker to select your date of birth</small>
    {formErrors.dateOfBirth && (
      <p className="mt-1 text-sm text-red-600">{formErrors.dateOfBirth}</p>
    )}
  </div>
</div>

                {/* Gender */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gender">
                    Gender
                  </label>
                  <select
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                {/* Preferred Language */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="preferredLanguage">
                    Preferred Language
                  </label>
                  <select
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="preferredLanguage"
                    name="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={handleChange}
                  >
                    <option value="English">English</option>
                    <option value="Sinhala">Sinhala</option>
                    <option value="Tamil">Tamil</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Russian">Russian</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>

                {/* Emergency Contact Section */}
                <div className="col-span-2 mt-6">
                  <h2 className="text-lg font-semibold mb-4">Emergency Contact</h2>
                </div>

                {/* Emergency Contact Name */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emergencyContactName">
                    Emergency Contact Name
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="emergencyContactName"
                    name="emergencyContactName"
                    type="text"
                    placeholder="Emergency contact name"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                  />
                </div>

                {/* Emergency Contact Phone */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emergencyContactPhone">
                    Emergency Contact Phone
                  </label>
                  <input
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      formErrors.emergencyContactPhone ? 'border-red-500' : ''
                    }`}
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    type="tel"
                    placeholder="e.g. +94771234567"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                  />
                  {formErrors.emergencyContactPhone && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.emergencyContactPhone}</p>
                  )}
                </div>

                {/* Travel Preferences Section */}
                <div className="col-span-2 mt-6">
                  <h2 className="text-lg font-semibold mb-4">Travel Preferences</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {travelPreferenceOptions.map(option => (
                      <div key={option.value} className="flex items-center">
                        <input
                          id={`pref-${option.value}`}
                          name="travelPreferences"
                          type="checkbox"
                          value={option.value}
                          checked={formData.travelPreferences.includes(option.value)}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`pref-${option.value}`} className="ml-2 text-sm text-gray-700">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="col-span-2 mt-6">
                  <h2 className="text-lg font-semibold mb-4">Change Password</h2>
                  <p className="text-gray-600 text-sm mb-4">Leave blank if you don't want to change your password</p>
                </div>

                {/* Current Password */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                    Current Password
                  </label>
                  <input
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      formErrors.password ? 'border-red-500' : ''
                    }`}
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Your current password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {formErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
                    New Password
                  </label>
                  <input
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      formErrors.newPassword ? 'border-red-500' : ''
                    }`}
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="New password"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                  {formErrors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                    Confirm New Password
                  </label>
                  <input
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      formErrors.confirmPassword ? 'border-red-500' : ''
                    }`}
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end mt-6">
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TouristProfile;
