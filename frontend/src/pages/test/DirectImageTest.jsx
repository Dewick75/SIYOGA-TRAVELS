import { useState, useEffect } from 'react';

function DirectImageTest() {
  const [imagePath, setImagePath] = useState('profile-pictures/1747021942220-323303409.png');
  const [baseUrl, setBaseUrl] = useState('http://localhost:5000/uploads');
  const [timestamp, setTimestamp] = useState(new Date().getTime());
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [errorDetails, setErrorDetails] = useState('');

  const fullImageUrl = `${baseUrl}/${imagePath}?t=${timestamp}`;

  // Check if the backend server is accessible
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        setConnectionStatus('checking');
        // Try to fetch the health endpoint from the backend
        const response = await fetch('http://localhost:5000/health', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          // Set a timeout to avoid waiting too long
          signal: AbortSignal.timeout(3000)
        });

        if (response.ok) {
          setConnectionStatus('connected');
          setErrorDetails('');
        } else {
          setConnectionStatus('error');
          setErrorDetails(`Backend responded with status: ${response.status}`);
        }
      } catch (error) {
        setConnectionStatus('error');
        setErrorDetails(`Connection error: ${error.message}`);
        console.error('Backend connection error:', error);
      }
    };

    checkBackendConnection();
  }, [baseUrl]);

  const refreshImage = () => {
    setTimestamp(new Date().getTime());
  };

  const checkConnection = () => {
    const backendUrl = new URL(baseUrl).origin;
    fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000)
    })
    .then(response => {
      if (response.ok) {
        setConnectionStatus('connected');
        setErrorDetails('');
        return response.json();
      } else {
        throw new Error(`Backend responded with status: ${response.status}`);
      }
    })
    .then(data => {
      console.log('Backend health check:', data);
    })
    .catch(error => {
      setConnectionStatus('error');
      setErrorDetails(`Connection error: ${error.message}`);
      console.error('Backend connection error:', error);
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">Direct Image Test</h1>

      {/* Connection Status Banner */}
      <div className={`mb-6 p-4 rounded-lg ${
        connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
        connectionStatus === 'checking' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">
              Backend Connection Status: {
                connectionStatus === 'connected' ? 'Connected' :
                connectionStatus === 'checking' ? 'Checking...' :
                'Error'
              }
            </h3>
            {errorDetails && <p className="mt-1">{errorDetails}</p>}
            {connectionStatus === 'error' && (
              <div className="mt-2">
                <p className="text-sm">Possible solutions:</p>
                <ul className="list-disc ml-5 text-sm">
                  <li>Make sure the backend server is running on port 5000</li>
                  <li>Check if CORS is properly configured on the backend</li>
                  <li>Try using a different port in the Base URL field</li>
                  <li>Check browser console for more detailed error messages</li>
                </ul>
              </div>
            )}
          </div>
          <button
            onClick={checkConnection}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Connection
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Image URL Construction</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Image Path
            </label>
            <input
              type="text"
              value={imagePath}
              onChange={(e) => setImagePath(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Timestamp
            </label>
            <div className="flex">
              <input
                type="text"
                value={timestamp}
                readOnly
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <button
                onClick={refreshImage}
                className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Full Image URL
          </label>
          <div className="bg-gray-100 p-2 rounded break-all">
            {fullImageUrl}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Image Preview</h2>

        <div className="flex flex-col items-center">
          <div className="mb-4 border p-2 rounded">
            <img
              src={fullImageUrl}
              alt="Profile"
              className="max-w-full h-auto max-h-64"
              onError={(e) => {
                console.error('Error loading image:', fullImageUrl);
                e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                e.target.className = 'max-w-full h-auto max-h-64 border-2 border-red-500';
              }}
            />
          </div>

          <div className="flex space-x-2">
            <a
              href={fullImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Open in New Tab
            </a>
            <button
              onClick={refreshImage}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Refresh Image
            </button>
          </div>
        </div>
      </div>

      {/* Alternative Backend Options */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Alternative Backend Options</h2>
        <p className="mb-4">If you're having trouble connecting to the backend, try these alternative URLs:</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setBaseUrl('http://localhost:5000/uploads')}
            className={`p-3 rounded ${baseUrl === 'http://localhost:5000/uploads' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Default: http://localhost:5000/uploads
          </button>

          <button
            onClick={() => setBaseUrl('http://127.0.0.1:5000/uploads')}
            className={`p-3 rounded ${baseUrl === 'http://127.0.0.1:5000/uploads' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Try IP: http://127.0.0.1:5000/uploads
          </button>

          <button
            onClick={() => setBaseUrl('/uploads')}
            className={`p-3 rounded ${baseUrl === '/uploads' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Try Relative: /uploads
          </button>

          <button
            onClick={() => setBaseUrl(window.location.origin + '/uploads')}
            className={`p-3 rounded ${baseUrl === window.location.origin + '/uploads' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Try Same Origin: {window.location.origin}/uploads
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Test All Known Images</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            'profile-pictures/1747021942220-323303409.png',
            'profile-pictures/1747025206069-982787919.jpg',
            'profile-pictures/1747025342176-299590845.jpg',
            'profile-pictures/1747025596569-339426563.jpg',
            'profile-pictures/1747028448251-904464168.jpg'
          ].map((path, index) => {
            const imgUrl = `${baseUrl}/${path}?t=${timestamp}`;
            return (
              <div key={index} className="border rounded p-2">
                <p className="text-sm text-gray-500 mb-2 break-all">{path}</p>
                <img
                  src={imgUrl}
                  alt={`Test ${index + 1}`}
                  className="w-full h-32 object-contain"
                  onError={(e) => {
                    console.error('Error loading image:', imgUrl);
                    e.target.src = 'https://via.placeholder.com/150?text=Error';
                    e.target.className = 'w-full h-32 object-contain border-2 border-red-500';
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DirectImageTest;
