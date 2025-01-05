import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { SRI_LANKA_CENTER, getDestinationCoordinates, createSearchMarker } from '../../utils/mapUtils';
import DestinationSearch from './DestinationSearch';

// Google Maps API key
const GOOGLE_MAPS_API_KEY = "AIzaSyAQ36vRGVFkSJjtgBGfE9Zboub2CPaGe7Q";

function GoogleMapSelector({ destinations, selectedDestinations, onDestinationSelect }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [infoWindow, setInfoWindow] = useState(null);
  const [searchMarker, setSearchMarker] = useState(null);

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

    // Create info window for markers
    const infoWindowInstance = new window.google.maps.InfoWindow();

    setMap(mapInstance);
    setInfoWindow(infoWindowInstance);

    // Add markers for destinations
    if (destinations && destinations.length > 0) {
      addDestinationMarkers(mapInstance, infoWindowInstance);
    }
  }, [destinations]);

  // Add markers for destinations
  const addDestinationMarkers = useCallback((mapInstance, infoWindowInstance) => {
    if (!mapInstance || !destinations || destinations.length === 0) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Create new markers
    const newMarkers = destinations.map(destination => {
      // Get coordinates for the destination
      const coordinates = getDestinationCoordinates(destination.name);
      const lat = coordinates.lat;
      const lng = coordinates.lng;

      const isSelected = selectedDestinations.some(
        selected => parseInt(selected.destinationId) === destination.destination_id
      );

      // Create marker
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstance,
        title: destination.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: isSelected ? '#4F46E5' : '#9CA3AF',
          fillOpacity: 0.8,
          strokeWeight: 2,
          strokeColor: isSelected ? '#4338CA' : '#6B7280',
        },
        animation: isSelected ? window.google.maps.Animation.BOUNCE : null,
      });

      // Add click event to marker
      marker.addListener('click', () => {
        // Show info window
        infoWindowInstance.setContent(`
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${destination.name}</h3>
            <p style="font-size: 12px; margin-bottom: 4px;">${destination.province}, ${destination.region}</p>
            <button
              id="select-destination-${destination.destination_id}"
              style="
                background-color: #4F46E5;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 4px;
              "
            >
              ${isSelected ? 'Selected' : 'Select Destination'}
            </button>
          </div>
        `);
        infoWindowInstance.open(mapInstance, marker);

        // Add click event to select button after info window is opened
        setTimeout(() => {
          const selectButton = document.getElementById(`select-destination-${destination.destination_id}`);
          if (selectButton) {
            selectButton.addEventListener('click', () => {
              onDestinationSelect(destination);
              infoWindowInstance.close();
            });
          }
        }, 10);
      });

      return marker;
    });

    setMarkers(newMarkers);
  }, [destinations, selectedDestinations, onDestinationSelect]);

  // Update markers when selected destinations change
  useEffect(() => {
    if (map && infoWindow) {
      addDestinationMarkers(map, infoWindow);
    }
  }, [map, infoWindow, selectedDestinations, addDestinationMarkers]);

  // Handle place selection from search
  const handlePlaceSelected = useCallback((place) => {
    if (!map) return;

    // Clear previous search marker
    if (searchMarker) {
      searchMarker.marker.setMap(null);
    }

    // Create new marker for the searched place
    const newSearchMarker = createSearchMarker(map, place, () => {
      // When user clicks "Add to Trip" in the info window
      // First check if this place is already in our destinations list
      const existingDestination = destinations.find(
        dest => dest.name.toLowerCase() === place.name.toLowerCase()
      );

      if (existingDestination) {
        // If it exists in our destinations, use that
        onDestinationSelect(existingDestination);
        toast.success(`Added ${existingDestination.name} to your trip`);
      } else {
        // Otherwise, we need to create a custom destination object
        // In a real app, you would save this to the database first
        const customDestination = {
          destination_id: `custom-${Date.now()}`,
          name: place.name,
          province: 'Custom Location',
          region: place.address || 'Sri Lanka',
          description: `Custom destination added from search: ${place.name}`,
          custom_coordinates: { lat: place.lat, lng: place.lng }
        };

        onDestinationSelect(customDestination);
        toast.success(`Added custom destination: ${place.name} to your trip`);
      }
    });

    setSearchMarker(newSearchMarker);

    // Pan to the searched location
    map.panTo({ lat: place.lat, lng: place.lng });
    map.setZoom(14); // Zoom in a bit more to show the location better

    // Open the info window
    newSearchMarker.infoWindow.open(map, newSearchMarker.marker);

    // Calculate and display route if we have a previous destination selected
    if (selectedDestinations && selectedDestinations.length > 0) {
      const lastSelectedDestination = selectedDestinations[selectedDestinations.length - 1];

      // Get coordinates for the last selected destination
      let originCoords;
      if (lastSelectedDestination.custom_coordinates) {
        originCoords = lastSelectedDestination.custom_coordinates;
      } else {
        originCoords = getDestinationCoordinates(lastSelectedDestination.name);
      }

      // Calculate route between last selected destination and new place
      calculateAndDisplayRoute(map, originCoords, { lat: place.lat, lng: place.lng });
    }
  }, [map, searchMarker, destinations, selectedDestinations, onDestinationSelect]);

  // Calculate and display route between two points
  const calculateAndDisplayRoute = useCallback((mapInstance, origin, destination) => {
    if (!window.google || !window.google.maps || !mapInstance) return;

    // Create DirectionsService and DirectionsRenderer
    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map: mapInstance,
      suppressMarkers: true, // Don't show default markers
      polylineOptions: {
        strokeColor: '#4F46E5', // Primary color
        strokeWeight: 5,
        strokeOpacity: 0.7
      }
    });

    // Request directions
    directionsService.route(
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

          // Display distance and duration in a toast
          toast.info(`Distance: ${leg.distance.text}, Duration: ${leg.duration.text}`, {
            autoClose: 5000
          });

          // Create info window with route details
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 200px;">
                <h3 style="font-weight: bold; margin-bottom: 4px;">Route Details</h3>
                <p style="font-size: 12px; margin-bottom: 4px;">Distance: ${leg.distance.text}</p>
                <p style="font-size: 12px; margin-bottom: 4px;">Duration: ${leg.duration.text}</p>
              </div>
            `,
            position: {
              lat: (origin.lat + destination.lat) / 2,
              lng: (origin.lng + destination.lng) / 2
            }
          });

          // Open info window
          infoWindow.open(mapInstance);

          // Close info window after 5 seconds
          setTimeout(() => {
            infoWindow.close();
          }, 5000);
        } else {
          toast.error(`Directions request failed: ${status}`);
        }
      }
    );
  }, []);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-300">
      <div className="p-3 bg-white border-b border-gray-300">
        <DestinationSearch
          onPlaceSelected={handlePlaceSelected}
          placeholder="Search for destinations in Sri Lanka..."
        />
      </div>
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }}></div>
    </div>
  );
}

export default GoogleMapSelector;
