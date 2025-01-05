import { useState } from 'react';
import DestinationSearch from '../../components/maps/DestinationSearch';
import RouteDisplay from '../../components/maps/RouteDisplay';

function MapSearchTest() {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [destinations, setDestinations] = useState([]);
  
  // Handle place selection
  const handlePlaceSelected = (place) => {
    setSelectedPlace(place);
    
    // Add to destinations list if not already added
    if (!destinations.some(dest => dest.name === place.name)) {
      setDestinations([...destinations, place]);
    }
  };
  
  // Get the last two selected destinations for route calculation
  const getRouteEndpoints = () => {
    if (destinations.length < 2) return { origin: null, destination: null };
    
    const lastIndex = destinations.length - 1;
    return {
      origin: destinations[lastIndex - 1],
      destination: destinations[lastIndex]
    };
  };
  
  const { origin, destination } = getRouteEndpoints();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Map Search Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Search for a destination</h2>
        <DestinationSearch 
          onPlaceSelected={handlePlaceSelected}
          placeholder="Search for destinations in Sri Lanka..."
        />
      </div>
      
      {selectedPlace && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Selected Place</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <p><strong>Name:</strong> {selectedPlace.name}</p>
            <p><strong>Address:</strong> {selectedPlace.address}</p>
            <p><strong>Coordinates:</strong> {selectedPlace.lat}, {selectedPlace.lng}</p>
          </div>
        </div>
      )}
      
      {destinations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Selected Destinations</h2>
          <ul className="divide-y divide-gray-200">
            {destinations.map((dest, index) => (
              <li key={index} className="py-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary-100 text-primary-800 font-bold rounded-full w-8 h-8 flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">{dest.name}</p>
                    <p className="text-sm text-gray-500">{dest.address}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {origin && destination && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Route</h2>
          <div className="h-96">
            <RouteDisplay 
              origin={{ lat: origin.lat, lng: origin.lng }}
              destination={{ lat: destination.lat, lng: destination.lng }}
              className="h-full rounded-md overflow-hidden"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MapSearchTest;
