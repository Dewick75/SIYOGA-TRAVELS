import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

// Google Maps API key
const GOOGLE_MAPS_API_KEY = "AIzaSyAQ36vRGVFkSJjtgBGfE9Zboub2CPaGe7Q";

function DestinationSearch({ onPlaceSelected, placeholder = "Search for a destination..." }) {
  const [searchInput, setSearchInput] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchBoxRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const mapRef = useRef(null);
  const [miniMap, setMiniMap] = useState(null);
  const [miniMapMarker, setMiniMapMarker] = useState(null);

  // Load Google Maps script
  useEffect(() => {
    // Check if Google Maps script is already loaded
    if (window.google && window.google.maps) {
      initializeServices();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initializeServices;
    script.onerror = () => toast.error('Failed to load Google Maps. Please try again later.');

    document.head.appendChild(script);

    return () => {
      // Clean up script if component unmounts before script loads
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize Google Maps services
  const initializeServices = () => {
    if (!window.google || !window.google.maps) return;

    autocompleteService.current = new window.google.maps.places.AutocompleteService();
    placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
  };

  // Initialize mini map when a place is selected
  const initializeMiniMap = (place) => {
    if (!window.google || !window.google.maps) return;

    // If map container doesn't exist yet, create it
    if (!mapRef.current) {
      const mapContainer = document.createElement('div');
      mapContainer.style.width = '100%';
      mapContainer.style.height = '150px';
      mapContainer.style.marginTop = '10px';
      mapContainer.style.borderRadius = '8px';
      mapContainer.style.overflow = 'hidden';
      mapRef.current = mapContainer;

      // Append to parent container
      if (searchBoxRef.current) {
        searchBoxRef.current.appendChild(mapRef.current);
      }
    }

    // Create or update map
    const location = { lat: place.lat, lng: place.lng };

    if (!miniMap) {
      // Create new map
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: location,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      });
      setMiniMap(mapInstance);

      // Create marker
      const marker = new window.google.maps.Marker({
        position: location,
        map: mapInstance,
        title: place.name,
        animation: window.google.maps.Animation.DROP,
      });
      setMiniMapMarker(marker);
    } else {
      // Update existing map
      miniMap.setCenter(location);
      miniMap.setZoom(15);

      // Update marker
      if (miniMapMarker) {
        miniMapMarker.setPosition(location);
        miniMapMarker.setTitle(place.name);
      } else {
        // Create marker if it doesn't exist
        const marker = new window.google.maps.Marker({
          position: location,
          map: miniMap,
          title: place.name,
          animation: window.google.maps.Animation.DROP,
        });
        setMiniMapMarker(marker);
      }
    }
  };

  // Handle search input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (!value.trim()) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    if (!autocompleteService.current) {
      toast.error('Search service not available. Please try again later.');
      return;
    }

    setLoading(true);

    // Restrict search to Sri Lanka
    const searchOptions = {
      input: value,
      componentRestrictions: { country: 'lk' },
      types: ['geocode', 'establishment', 'natural_feature', 'point_of_interest', 'tourist_attraction']
    };

    autocompleteService.current.getPlacePredictions(searchOptions, (results, status) => {
      setLoading(false);

      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results) {
        setPredictions([]);
        setShowPredictions(false);
        return;
      }

      setPredictions(results);
      setShowPredictions(true);
    });
  };

  // Handle place selection
  const handlePlaceSelect = (placeId) => {
    if (!placesService.current) {
      toast.error('Place details service not available. Please try again later.');
      return;
    }

    setLoading(true);

    placesService.current.getDetails({ placeId, fields: ['name', 'geometry', 'formatted_address'] }, (place, status) => {
      setLoading(false);

      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) {
        toast.error('Failed to get place details. Please try again.');
        return;
      }

      // Set the search input to the selected place name
      setSearchInput(place.name);
      setShowPredictions(false);

      // Create place object
      const placeObj = {
        name: place.name,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address
      };

      // Initialize or update mini map
      initializeMiniMap(placeObj);

      // Call the callback with the selected place
      onPlaceSelected(placeObj);
    });
  };

  // Handle click outside to close predictions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={searchBoxRef}>
      <div className="relative">
        <input
          type="text"
          value={searchInput}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pl-10 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>

      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
          <div className="flex">
            {/* Left side: Predictions list */}
            <div className="w-1/2 border-r border-gray-200">
              <ul className="py-1">
                {predictions.map((prediction) => (
                  <li
                    key={prediction.place_id}
                    onClick={() => handlePlaceSelect(prediction.place_id)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="font-medium">{prediction.structured_formatting.main_text}</div>
                    <div className="text-sm text-gray-500">{prediction.structured_formatting.secondary_text}</div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right side: Mini map preview */}
            <div className="w-1/2 p-2">
              <div
                id="prediction-map-preview"
                className="w-full h-full bg-gray-100 rounded flex items-center justify-center"
                style={{ minHeight: '150px' }}
              >
                <p className="text-sm text-gray-500 text-center p-2">
                  Select a location to see it on the map
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DestinationSearch;
