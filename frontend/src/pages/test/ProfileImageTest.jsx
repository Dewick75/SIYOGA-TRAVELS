import { useState, useEffect } from 'react';

function ProfileImageTest() {
  const [profileData, setProfileData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchProfilePictures = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/tourists/test-profile-picture');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          console.log('Profile picture data:', data.data);
          setProfileData(data.data);
        } else {
          setError(data.message || 'No profile pictures found');
        }
      } catch (err) {
        console.error('Error fetching profile pictures:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfilePictures();
  }, []);

  const handleImageClick = (imagePath) => {
    // Create the full URL to the image
    const fullPath = `http://localhost:5000/uploads/${imagePath}`;
    setSelectedImage(fullPath);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold mb-6">Profile Image Test</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">Profile Image Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left side - List of profile pictures */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Available Profile Pictures</h2>
          
          {profileData.length === 0 ? (
            <p className="text-gray-500">No profile pictures found</p>
          ) : (
            <ul className="space-y-4">
              {profileData.map((profile) => (
                <li key={profile.TouristID} className="border-b pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{profile.Name}</p>
                      <p className="text-sm text-gray-500 break-all">{profile.ProfilePicture}</p>
                    </div>
                    <button
                      onClick={() => handleImageClick(profile.ProfilePicture)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Right side - Selected image display */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Image Preview</h2>
          
          {selectedImage ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={selectedImage}
                  alt="Profile"
                  className="max-w-full h-auto max-h-64 rounded"
                  onError={(e) => {
                    console.error('Error loading image:', selectedImage);
                    e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                    e.target.className = 'max-w-full h-auto max-h-64 rounded border-2 border-red-500';
                  }}
                />
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-500 break-all">URL: {selectedImage}</p>
                <div className="mt-2 flex space-x-2">
                  <a
                    href={selectedImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Open in New Tab
                  </a>
                  <button
                    onClick={() => {
                      // Try to load the image with a different timestamp
                      const newUrl = `${selectedImage.split('?')[0]}?t=${new Date().getTime()}`;
                      setSelectedImage(newUrl);
                    }}
                    className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64 bg-gray-100 rounded">
              <p className="text-gray-500">Select an image to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileImageTest;
