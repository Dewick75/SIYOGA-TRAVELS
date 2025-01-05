import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { SRI_LANKA_CENTER, getDestinationCoordinates } from '../../utils/mapUtils';

// Google Maps API key
const GOOGLE_MAPS_API_KEY = "AIzaSyAQ36vRGVFkSJjtgBGfE9Zboub2CPaGe7Q";

function TripRouteMap({ destinations, selectedStops }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [polyline, setPolyline] = useState(null);

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
    script.onerror = () => toast.error('Failed to load Google Maps. Please try again later.');

    document.head.appendChild(script);

    return () => {
      // Clean up script if component unmounts before script loads
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize map when Google Maps script is loaded
  const initializeMap = useCallback(() => {
    if (!window.google || !mapRef.current) return;

    // Center map on Sri Lanka
    const sriLankaCenter = SRI_LANKA_CENTER;

    // Create map instance
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: sriLankaCenter,
      zoom: 8,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    setMap(mapInstance);

    // Add markers and route if we have selected stops
    if (selectedStops && selectedStops.length > 0 && destinations && destinations.length > 0) {
      drawRouteAndMarkers(mapInstance);
    }
  }, [destinations, selectedStops]);

  // Draw route and markers for selected stops
  const drawRouteAndMarkers = useCallback((mapInstance) => {
    if (!mapInstance || !selectedStops || selectedStops.length === 0 || !destinations || destinations.length === 0) return;

    // Clear existing markers and polyline
    markers.forEach(marker => marker.setMap(null));
    if (polyline) polyline.setMap(null);

    // Get coordinates for selected stops
    const validStops = selectedStops.filter(stop => stop.destinationId);
    if (validStops.length === 0) return;

    const routeCoordinates = [];
    const newMarkers = [];

    validStops.forEach((stop, index) => {
      const destinationId = parseInt(stop.destinationId);
      const destination = destinations.find(d => d.destination_id === destinationId);

      if (!destination) return;

      // Get coordinates for the destination
      // If this is a custom destination from search, use its stored coordinates
      const coordinates = destination.custom_coordinates || getDestinationCoordinates(destination.name);
      routeCoordinates.push(coordinates);

      // Create marker
      const marker = new window.google.maps.Marker({
        position: coordinates,
        map: mapInstance,
        title: `${index + 1}. ${destination.name}`,
        label: {
          text: (index + 1).toString(),
          color: 'white',
          fontWeight: 'bold',
        },
        animation: window.google.maps.Animation.DROP,
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${index + 1}. ${destination.name}</h3>
            <p style="font-size: 12px; margin-bottom: 4px;">${destination.province}, ${destination.region}</p>
            ${stop.overnightStay ? '<p style="font-size: 12px; color: #4F46E5;"><strong>Overnight Stay</strong></p>' : ''}
            ${stop.notes ? `<p style="font-size: 12px; margin-top: 4px;">${stop.notes}</p>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker);
      });

      newMarkers.push(marker);
    });

    // Create polyline for the route
    if (routeCoordinates.length > 1) {
      const newPolyline = new window.google.maps.Polyline({
        path: routeCoordinates,
        geodesic: true,
        strokeColor: '#4F46E5',
        strokeOpacity: 0.8,
        strokeWeight: 3,
      });

      newPolyline.setMap(mapInstance);
      setPolyline(newPolyline);

      // Fit bounds to show all markers
      const bounds = new window.google.maps.LatLngBounds();
      routeCoordinates.forEach(coord => bounds.extend(coord));
      mapInstance.fitBounds(bounds);
    }

    setMarkers(newMarkers);
  }, [destinations, selectedStops, markers, polyline]);

  // Update route and markers when selected stops change
  useEffect(() => {
    if (map) {
      drawRouteAndMarkers(map);
    }
  }, [map, selectedStops, drawRouteAndMarkers]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-300">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }}></div>
    </div>
  );
}

export default TripRouteMap;
