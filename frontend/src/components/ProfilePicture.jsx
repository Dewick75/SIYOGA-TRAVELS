import React, { useState, useEffect } from 'react';

/**
 * ProfilePicture component for displaying user profile pictures
 * @param {string} src - The source URL of the profile picture
 * @param {string} alt - Alt text for the image
 * @param {string} className - Additional CSS classes
 * @param {function} onUpload - Function to call when a new image is uploaded
 * @param {boolean} editable - Whether the profile picture can be changed
 */
const ProfilePicture = ({ src, alt = "Profile Picture", className = "", onUpload, editable = true }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add a timestamp to prevent caching
  useEffect(() => {
    if (src) {
      const timestamp = new Date().getTime();
      // Check if src is a blob URL (for newly selected files)
      if (src.startsWith('blob:')) {
        setImageUrl(src);
        console.log("ProfilePicture component - Blob URL set:", src);
      } else {
        // For server images, verify the URL format and add timestamp
        try {
          // Create a URL object to validate the URL
          new URL(src);

          // Add timestamp to prevent caching for server images
          const urlWithTimestamp = `${src}${src.includes('?') ? '&' : '?'}t=${timestamp}`;
          setImageUrl(urlWithTimestamp);

          // Log for debugging
          console.log("ProfilePicture component - Image URL set:", urlWithTimestamp);
        } catch (e) {
          console.error("Invalid URL provided to ProfilePicture:", src);
          setError(true);
        }
      }
      setLoading(false);
    } else {
      setImageUrl(null);
      setLoading(false);
      console.log("ProfilePicture component - No source provided");
    }
  }, [src]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target.result);
        setError(false);
        if (onUpload) {
          onUpload(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative">
      {loading ? (
        <div className="h-24 w-24 rounded-full bg-gray-200 animate-pulse"></div>
      ) : imageUrl && !error ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt={alt}
            className={`h-24 w-24 rounded-full object-cover border-2 border-primary-300 ${className}`}
            onError={(e) => {
              console.error("Error loading profile image:", imageUrl);
              console.error("Image error event:", e);
              setError(true);
            }}
          />
          {editable && (
            <div className="absolute bottom-0 right-0">
              <label htmlFor="profile-picture-upload" className="cursor-pointer bg-primary-500 text-white rounded-full p-1 shadow-md hover:bg-primary-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </label>
              <input
                id="profile-picture-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
            <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          {editable && (
            <div className="absolute bottom-0 right-0">
              <label htmlFor="profile-picture-upload" className="cursor-pointer bg-primary-500 text-white rounded-full p-1 shadow-md hover:bg-primary-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </label>
              <input
                id="profile-picture-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePicture;
