/**
 * Map utility functions for the trip planning feature
 */

// Sri Lanka coordinates
export const SRI_LANKA_CENTER = { lat: 7.8731, lng: 80.7718 };

// Predefined coordinates for major destinations in Sri Lanka
// These are approximate coordinates for testing purposes
export const SRI_LANKA_DESTINATIONS = {
  'Colombo': { lat: 6.9271, lng: 79.8612 },
  'Kandy': { lat: 7.2906, lng: 80.6337 },
  'Galle': { lat: 6.0535, lng: 80.2210 },
  'Anuradhapura': { lat: 8.3114, lng: 80.4037 },
  'Jaffna': { lat: 9.6615, lng: 80.0255 },
  'Trincomalee': { lat: 8.5874, lng: 81.2152 },
  'Nuwara Eliya': { lat: 6.9497, lng: 80.7891 },
  'Polonnaruwa': { lat: 7.9403, lng: 81.0188 },
  'Batticaloa': { lat: 7.7246, lng: 81.7006 },
  'Negombo': { lat: 7.2081, lng: 79.8371 },
  'Mirissa': { lat: 5.9483, lng: 80.4589 },
  'Arugam Bay': { lat: 6.8339, lng: 81.8341 },
  'Unawatuna': { lat: 6.0169, lng: 80.2496 },
  'Pasikuda': { lat: 7.9228, lng: 81.5651 },
  'Bentota': { lat: 6.4213, lng: 79.9959 },
  'Yala National Park': { lat: 6.3698, lng: 81.5046 },
  'Udawalawe National Park': { lat: 6.4389, lng: 80.8982 },
  'Sinharaja Forest Reserve': { lat: 6.4000, lng: 80.5000 },
  'Horton Plains National Park': { lat: 6.8000, lng: 80.8333 },
  'Wilpattu National Park': { lat: 8.4567, lng: 80.0139 },
  'Ella': { lat: 6.8667, lng: 81.0466 },
  'Haputale': { lat: 6.7667, lng: 80.9667 },
  'Adams Peak': { lat: 6.8096, lng: 80.4994 },
  'Dambulla': { lat: 7.8675, lng: 80.6518 },
  'Sigiriya': { lat: 7.9570, lng: 80.7603 }
};

/**
 * Get coordinates for a destination
 * @param {string} destinationName - The name of the destination
 * @returns {Object} - The coordinates of the destination
 */
export const getDestinationCoordinates = (destinationName) => {
  // Check if we have predefined coordinates for this destination
  if (SRI_LANKA_DESTINATIONS[destinationName]) {
    return SRI_LANKA_DESTINATIONS[destinationName];
  }

  // If not, return a random location near Sri Lanka center
  return {
    lat: SRI_LANKA_CENTER.lat + (Math.random() - 0.5) * 2,
    lng: SRI_LANKA_CENTER.lng + (Math.random() - 0.5) * 2
  };
};

/**
 * Calculate the distance between two coordinates in kilometers
 * @param {Object} coord1 - The first coordinate { lat, lng }
 * @param {Object} coord2 - The second coordinate { lat, lng }
 * @returns {number} - The distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(coord2.lat - coord1.lat);
  const dLng = deg2rad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(coord1.lat)) * Math.cos(deg2rad(coord2.lat)) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
};

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} - Radians
 */
const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

/**
 * Estimate travel time between two coordinates
 * @param {Object} coord1 - The first coordinate { lat, lng }
 * @param {Object} coord2 - The second coordinate { lat, lng }
 * @param {number} avgSpeed - Average speed in km/h (default: 40)
 * @returns {number} - The travel time in hours
 */
export const estimateTravelTime = (coord1, coord2, avgSpeed = 40) => {
  const distance = calculateDistance(coord1, coord2);
  return distance / avgSpeed;
};

/**
 * Create a custom marker for a searched place
 * @param {Object} map - Google Maps instance
 * @param {Object} place - Place object with name, lat, lng
 * @param {Function} onClick - Click handler for the marker
 * @returns {Object} - Google Maps Marker instance
 */
export const createSearchMarker = (map, place, onClick) => {
  if (!map || !place || !window.google) return null;

  // Create marker
  const marker = new window.google.maps.Marker({
    position: { lat: place.lat, lng: place.lng },
    map: map,
    title: place.name,
    animation: window.google.maps.Animation.DROP,
    icon: {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: '#EF4444', // Red color for search results
      fillOpacity: 0.8,
      strokeWeight: 2,
      strokeColor: '#B91C1C',
    }
  });

  // Create info window
  const infoWindow = new window.google.maps.InfoWindow({
    content: `
      <div style="padding: 8px; max-width: 200px;">
        <h3 style="font-weight: bold; margin-bottom: 4px;">${place.name}</h3>
        <p style="font-size: 12px; margin-bottom: 8px;">${place.address || ''}</p>
        <button
          id="add-destination-btn"
          style="
            background-color: #4F46E5;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          Add to Trip
        </button>
      </div>
    `
  });

  // Add click event
  marker.addListener('click', () => {
    infoWindow.open(map, marker);

    // Add click event to the Add button after info window is opened
    setTimeout(() => {
      const addButton = document.getElementById('add-destination-btn');
      if (addButton) {
        addButton.addEventListener('click', () => {
          if (onClick) onClick(place);
          infoWindow.close();
        });
      }
    }, 10);
  });

  return { marker, infoWindow };
};

/**
 * Calculate route between two points using Google Maps Directions API
 * @param {Object} origin - Origin coordinates { lat, lng }
 * @param {Object} destination - Destination coordinates { lat, lng }
 * @returns {Promise} - Promise that resolves with route details
 */
export const calculateRoute = (origin, destination) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error('Google Maps not loaded'));
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          const route = result.routes[0];
          const leg = route.legs[0];

          resolve({
            distance: leg.distance,
            duration: leg.duration,
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            steps: leg.steps,
            result: result // Include full result for rendering
          });
        } else {
          reject(new Error(`Directions request failed: ${status}`));
        }
      }
    );
  });
};
