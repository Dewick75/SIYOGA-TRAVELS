import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { calculateRoute } from '../../utils/mapUtils';

// Google Maps API key
const GOOGLE_MAPS_API_KEY = "AIzaSyAQ36vRGVFkSJjtgBGfE9Zboub2CPaGe7Q";

function RouteDisplay({ origin, destination, className }) {
  const [routeDetails, setRouteDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  
  // Load Google Maps script
  useEffect(() => {
    // Check if Google Maps script is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }
    
    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    script.onerror = () => {
      setError('Failed to load Google Maps. Please try again later.');
      toast.error('Failed to load Google Maps. Please try again later.');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Clean up script if component unmounts before script loads
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);
  
  // Initialize map
  const initializeMap = () => {
    if (!window.google || !window.google.maps || !mapRef.current) return;
    
    // Create map instance
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: 7.8731, lng: 80.7718 }, // Sri Lanka center
      zoom: 8,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
    });
    
    setMap(mapInstance);
    
    // Create directions renderer
    const renderer = new window.google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#4F46E5', // Primary color
        strokeWeight: 5,
        strokeOpacity: 0.7
      }
    });
    
    renderer.setMap(mapInstance);
    setDirectionsRenderer(renderer);
  };
  
  // Calculate route when origin and destination change
  useEffect(() => {
    if (!origin || !destination || !map || !directionsRenderer) return;
    
    setLoading(true);
    setError(null);
    
    calculateRoute(origin, destination)
      .then(details => {
        setRouteDetails(details);
        directionsRenderer.setDirections(details.result);
        
        // Fit map to route bounds
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(destination);
        map.fitBounds(bounds);
        
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        toast.error(err.message);
        setLoading(false);
      });
  }, [origin, destination, map, directionsRenderer]);
  
  return (
    <div className={`route-display ${className || ''}`}>
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-red-600 text-center p-4">
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '200px' }}></div>
      
      {routeDetails && (
        <div className="bg-white p-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Distance: <span className="text-gray-700">{routeDetails.distance.text}</span></p>
              <p className="text-sm font-medium">Duration: <span className="text-gray-700">{routeDetails.duration.text}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RouteDisplay;
