import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';

// Google Maps API key
const GOOGLE_MAPS_API_KEY = "AIzaSyAQ36vRGVFkSJjtgBGfE9Zboub2CPaGe7Q";

function RouteCalculator({ origin, destination, map, onRouteCalculated }) {
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const directionsService = useRef(null);
  
  // Initialize directions service
  useEffect(() => {
    if (!window.google || !window.google.maps) {
      // Load Google Maps script if not already loaded
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeDirectionsService;
      script.onerror = () => toast.error('Failed to load Google Maps. Please try again later.');
      
      document.head.appendChild(script);
      
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    } else {
      initializeDirectionsService();
    }
  }, []);
  
  // Initialize directions service
  const initializeDirectionsService = useCallback(() => {
    if (!window.google || !window.google.maps) return;
    
    directionsService.current = new window.google.maps.DirectionsService();
    
    // Create directions renderer
    const renderer = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true, // Don't show default markers
      polylineOptions: {
        strokeColor: '#4F46E5', // Primary color
        strokeWeight: 5,
        strokeOpacity: 0.7
      }
    });
    
    setDirectionsRenderer(renderer);
  }, []);
  
  // Calculate route when origin, destination, or map changes
  useEffect(() => {
    if (!origin || !destination || !map || !directionsService.current || !directionsRenderer) return;
    
    // Set map for renderer
    directionsRenderer.setMap(map);
    
    // Request directions
    directionsService.current.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          // Display the route
          directionsRenderer.setDirections(result);
          
          // Get distance and duration
          const route = result.routes[0];
          const leg = route.legs[0];
          
          // Set route details
          const details = {
            distance: leg.distance,
            duration: leg.duration,
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            steps: leg.steps
          };
          
          setRouteDetails(details);
          
          // Call callback with route details
          if (onRouteCalculated) {
            onRouteCalculated(details);
          }
          
          // Display distance and duration in a toast
          toast.info(`Distance: ${leg.distance.text}, Duration: ${leg.duration.text}`, {
            autoClose: 5000
          });
        } else {
          toast.error(`Directions request failed: ${status}`);
        }
      }
    );
    
    // Clean up
    return () => {
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
    };
  }, [origin, destination, map, directionsRenderer, onRouteCalculated]);
  
  // Return route details for parent component to use
  return routeDetails;
}

export default RouteCalculator;
