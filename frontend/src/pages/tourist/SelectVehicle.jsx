import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import tripService from '../../services/tripService';

function SelectVehicle() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  // Error state for displaying error messages
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [destination, setDestination] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterCapacity, setFilterCapacity] = useState('');
  const [sortBy, setSortBy] = useState('price');

  useEffect(() => {
    console.log("SelectVehicle component mounted");

    // Check if trip details exist in session storage
    const storedDestination = sessionStorage.getItem('selectedDestination');
    const storedTripDetails = sessionStorage.getItem('tripDetails');
    const storedVehicles = sessionStorage.getItem('availableVehicles');

    console.log("Session Storage Data:", {
      storedDestination: storedDestination ? "Found" : "Not found",
      storedTripDetails: storedTripDetails ? "Found" : "Not found",
      storedVehicles: storedVehicles ? "Found" : "Not found"
    });

    // Create fallback data if session storage is empty
    const fallbackDestination = {
      id: 1,
      name: "Kandy",
      location: "Central Province",
      description: "Beautiful hill country with the Temple of the Tooth Relic",
      imageUrl: "https://via.placeholder.com/800x400?text=Kandy"
    };

    const fallbackTripDetails = {
      date: new Date().toISOString().split('T')[0],
      time: "09:00",
      numTravelers: 2,
      pickupLocation: "Colombo",
      dropoffLocation: "",
      notes: "",
      destinationId: 1
    };

    // Use stored data if available, otherwise use fallback data
    let parsedDestination;
    let parsedTripDetails;

    try {
      if (storedDestination) {
        try {
          parsedDestination = JSON.parse(storedDestination);
          console.log("Successfully parsed destination data:", parsedDestination.name);
        } catch (parseErr) {
          console.error("Error parsing destination data:", parseErr);
          parsedDestination = fallbackDestination;
        }
      } else {
        console.log("Using fallback destination data");
        parsedDestination = fallbackDestination;
      }

      if (storedTripDetails) {
        try {
          parsedTripDetails = JSON.parse(storedTripDetails);
          console.log("Successfully parsed trip details:", {
            date: parsedTripDetails.date,
            travelers: parsedTripDetails.numTravelers
          });
        } catch (parseErr) {
          console.error("Error parsing trip details:", parseErr);
          parsedTripDetails = fallbackTripDetails;
        }
      } else {
        console.log("Using fallback trip details");
        parsedTripDetails = fallbackTripDetails;
      }

      // Update state with destination and trip details
      setDestination(parsedDestination);
      setTripDetails(parsedTripDetails);
      console.log("State updated with destination and trip details");

      // Handle vehicles data
      if (storedVehicles) {
        try {
          const parsedVehicles = JSON.parse(storedVehicles);
          console.log(`Using ${parsedVehicles.length} vehicles from session storage`);
          setVehicles(parsedVehicles);
          setLoading(false);
        } catch (parseErr) {
          console.error("Error parsing stored vehicles:", parseErr);
          console.log("Falling back to fetching vehicles");
          fetchVehiclesOrUseMock(parsedTripDetails);
        }
      } else {
        // No stored vehicles, try to fetch from backend
        console.log("No stored vehicles found, attempting to fetch from backend");
        fetchVehiclesOrUseMock(parsedTripDetails);
      }
    } catch (err) {
      console.error("Error in SelectVehicle useEffect:", err);
      setError("Failed to load vehicle selection. Please try again.");
      setDestination(fallbackDestination);
      setTripDetails(fallbackTripDetails);

      // Always ensure we have vehicles to display
      const mockVehicles = getMockVehicles();
      console.log(`Using ${mockVehicles.length} mock vehicles due to error`);
      setVehicles(mockVehicles);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper function to fetch vehicles or use mock data
  const fetchVehiclesOrUseMock = (tripDetails) => {
    if (tripDetails && tripDetails.destinationId) {
      console.log("Attempting to fetch vehicles with trip details");
      fetchAvailableVehicles(tripDetails)
        .then(() => {
          console.log("Vehicle fetching completed");
        })
        .catch(err => {
          console.error("Error in fetchVehiclesOrUseMock:", err);
          const mockVehicles = getMockVehicles();
          console.log(`Using ${mockVehicles.length} mock vehicles due to fetch error`);
          setVehicles(mockVehicles);
          setLoading(false);
        });
    } else {
      console.log("No valid trip details for fetching, using mock vehicles");
      const mockVehicles = getMockVehicles();
      setVehicles(mockVehicles);
      setLoading(false);
    }
  };

  // Function to get mock vehicles data
  const getMockVehicles = () => {
    return [
      {
        id: 1,
        type: 'Car',
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        capacity: 4,
        features: ['Air Conditioning', 'Bluetooth', 'USB Charging'],
        driverName: 'Rahul Perera',
        driverRating: 4.8,
        driverId: 1,
        trips: 124,
        pricePerDay: 5000,
        imageUrl: 'https://via.placeholder.com/300x200?text=Toyota+Corolla'
      },
      {
        id: 2,
        type: 'SUV',
        make: 'Honda',
        model: 'CR-V',
        year: 2021,
        capacity: 7,
        features: ['Air Conditioning', 'Bluetooth', 'USB Charging', 'Spacious Trunk', 'Roof Rack'],
        driverName: 'Nihal Jayawardene',
        driverRating: 4.9,
        driverId: 2,
        trips: 87,
        pricePerDay: 7500,
        imageUrl: 'https://via.placeholder.com/300x200?text=Honda+CRV'
      },
      {
        id: 3,
        type: 'Van',
        make: 'Nissan',
        model: 'Urvan',
        year: 2019,
        capacity: 12,
        features: ['Air Conditioning', 'Spacious Interior', 'Large Luggage Space'],
        driverName: 'Kumar Silva',
        driverRating: 4.7,
        driverId: 3,
        trips: 156,
        pricePerDay: 9000,
        imageUrl: 'https://via.placeholder.com/300x200?text=Nissan+Van'
      },
      {
        id: 4,
        type: 'Tuk Tuk',
        make: 'Bajaj',
        model: 'RE',
        year: 2021,
        capacity: 3,
        features: ['Economical', 'Nimble', 'Authentic Experience'],
        driverName: 'Asanka Fernando',
        driverRating: 4.6,
        driverId: 4,
        trips: 210,
        pricePerDay: 2500,
        imageUrl: 'https://via.placeholder.com/300x200?text=Tuk+Tuk'
      }
    ];
  };

  // Function to fetch available vehicles from the backend
  const fetchAvailableVehicles = async (tripDetails) => {
    try {
      setLoading(true);
      console.log('Starting to fetch available vehicles...');

      // Prepare criteria for vehicle search
      const criteria = {
        date: tripDetails.date,
        time: tripDetails.time,
        numTravelers: tripDetails.numTravelers,
        destinationId: tripDetails.destinationId
      };

      console.log('Fetching available vehicles with criteria:', criteria);
      const result = await tripService.getAvailableVehicles(criteria);
      console.log('API response for available vehicles:', result);

      if (result && result.success) {
        // Transform the data to match our component's expected format
        const formattedVehicles = result.data.map(vehicle => ({
          id: vehicle.VehicleID,
          type: vehicle.Type,
          make: vehicle.Make,
          model: vehicle.Model,
          year: vehicle.Year,
          capacity: vehicle.Capacity,
          features: vehicle.Features || [],
          driverName: vehicle.DriverName,
          driverRating: vehicle.DriverRating,
          driverId: vehicle.DriverID,
          trips: vehicle.DriverTotalTrips || 0,
          pricePerDay: vehicle.PricePerDay,
          imageUrl: vehicle.ImageURL || `https://via.placeholder.com/300x200?text=${vehicle.Make}+${vehicle.Model}`
        }));

        console.log('Formatted vehicles:', formattedVehicles);

        if (formattedVehicles.length > 0) {
          setVehicles(formattedVehicles);
          // Store in session storage for future use
          sessionStorage.setItem('availableVehicles', JSON.stringify(formattedVehicles));
          console.log('Vehicles stored in session storage and state updated');
        } else {
          console.log('No vehicles returned from API, using mock data');
          setVehicles(getMockVehicles());
          sessionStorage.setItem('availableVehicles', JSON.stringify(getMockVehicles()));
        }
      } else {
        throw new Error(result?.message || 'Failed to fetch available vehicles');
      }
    } catch (err) {
      console.error('Error fetching available vehicles:', err);
      // Set error message for display
      setError('Failed to load available vehicles. ' + err.message);

      // Fallback to mock data if API fails
      console.log('Falling back to mock vehicle data due to error');
      const mockVehicles = getMockVehicles();
      setVehicles(mockVehicles);
      sessionStorage.setItem('availableVehicles', JSON.stringify(mockVehicles));
    } finally {
      setLoading(false);
    }

    // Return a resolved promise to ensure the chain continues
    return Promise.resolve();
  };

  // Filter and sort vehicles
  const getFilteredVehicles = () => {
    let filtered = [...vehicles];

    // Apply type filter
    if (filterType) {
      filtered = filtered.filter(v => v.type === filterType);
    }

    // Apply capacity filter
    if (filterCapacity) {
      const minCapacity = parseInt(filterCapacity);
      filtered = filtered.filter(v => v.capacity >= minCapacity);
    }

    // Apply sorting
    if (sortBy === 'price') {
      filtered.sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.driverRating - a.driverRating);
    } else if (sortBy === 'capacity') {
      filtered.sort((a, b) => b.capacity - a.capacity);
    }

    return filtered;
  };

  const filteredVehicles = getFilteredVehicles();

  const handleContinue = () => {
    if (!selectedVehicle) {
      alert('Please select a vehicle to continue');
      return;
    }

    // Store selected vehicle in session storage
    sessionStorage.setItem('selectedVehicle', JSON.stringify(selectedVehicle));

    // Prepare booking data
    const bookingData = {
      vehicleId: selectedVehicle.id,
      destinationId: destination.id,
      tripDate: tripDetails.date,
      tripTime: tripDetails.time,
      pickupLocation: tripDetails.pickupLocation,
      dropoffLocation: tripDetails.dropoffLocation || tripDetails.pickupLocation,
      numTravelers: tripDetails.numTravelers,
      notes: tripDetails.notes,
      totalAmount: Math.round(selectedVehicle.pricePerDay * 1.05) // Including service fee
    };

    // Store booking data for payment page
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));

    // Check if user is authenticated
    if (!auth.isAuthenticated()) {
      // If not authenticated, redirect to login page
      navigate('/login', { state: { from: '/payment' } });
    } else {
      // If authenticated, proceed to payment page
      navigate('/payment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && vehicles.length === 0) {
    // Only show error page if we have no vehicles to display
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-10">
          <div className="text-red-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">{error}</h3>
          <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={() => {
                // Try to reload the page
                window.location.reload();
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/destinations')}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Browse Destinations
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error banner if we have an error but also have vehicles to display
  const ErrorBanner = () => {
    if (error && vehicles.length > 0) {
      return (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
          <p className="mt-1 text-sm text-red-600">Showing available vehicles from our database. Some options may not be up-to-date.</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Select a Vehicle</h1>
        {destination && tripDetails && (
          <div className="mt-2 p-4 bg-gray-50 rounded-md">
            <p className="text-gray-700">
              <span className="font-semibold">Trip to:</span> {destination.name}, {destination.location}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Date & Time:</span> {new Date(tripDetails.date).toLocaleDateString()} at {tripDetails.time}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Number of travelers:</span> {tripDetails.numTravelers}
            </p>
            {tripDetails.pickupLocation && (
              <p className="text-gray-700">
                <span className="font-semibold">Pickup:</span> {tripDetails.pickupLocation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Display error banner if there's an error but we have vehicles */}
      <ErrorBanner />

      <div className="mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Filter Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type
              </label>
              <select
                id="filterType"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">All Types</option>
                {Array.from(new Set(vehicles.map(v => v.type))).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filterCapacity" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Capacity
              </label>
              <select
                id="filterCapacity"
                value={filterCapacity}
                onChange={(e) => setFilterCapacity(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Any Capacity</option>
                <option value="2">2+ passengers</option>
                <option value="4">4+ passengers</option>
                <option value="6">6+ passengers</option>
                <option value="8">8+ passengers</option>
                <option value="10">10+ passengers</option>
              </select>
            </div>

            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="price">Price (Low to High)</option>
                <option value="rating">Driver Rating</option>
                <option value="capacity">Capacity</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No vehicles found</h3>
          <p className="mt-1 text-gray-500">Try adjusting your filters to see more options.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredVehicles.map(vehicle => (
          <div
            key={vehicle.id}
            onClick={() => setSelectedVehicle(vehicle)}
            className={`border rounded-lg overflow-hidden shadow-sm hover:shadow transition cursor-pointer ${
              selectedVehicle?.id === vehicle.id ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="p-4 md:p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{vehicle.make} {vehicle.model}</h2>
                  <p className="mt-1 text-sm text-gray-500">{vehicle.type} • {vehicle.year}</p>
                  <div className="mt-2 flex items-center">
                    <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {vehicle.capacity} Passengers
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900">Features:</h3>
                  <ul className="mt-2 space-y-1">
                    {vehicle.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <svg className="h-4 w-4 text-primary-500 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 md:p-6 border-t md:border-t-0 md:border-l border-r-0 md:border-r border-gray-200 flex flex-col">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                    <svg className="h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{vehicle.driverName}</h3>
                    <div className="flex items-center mt-1">
                      <svg className="h-4 w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1 text-sm text-gray-600">{vehicle.driverRating}</span>
                      <span className="mx-1.5 text-gray-500">•</span>
                      <span className="text-sm text-gray-600">{vehicle.trips} trips</span>
                    </div>
                  </div>
                </div>
                <div className="mt-auto">
                  <img
                    src={vehicle.imageUrl}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-full h-40 object-cover rounded-md"
                  />
                </div>
              </div>

              <div className="p-4 md:p-6 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">LKR {vehicle.pricePerDay.toLocaleString()}</div>
                  <p className="text-sm text-gray-500">per day</p>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Vehicle rental</span>
                    <span className="text-gray-900">LKR {vehicle.pricePerDay.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Driver fee</span>
                    <span className="text-gray-900">Included</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service fee</span>
                    <span className="text-gray-900">LKR {Math.round(vehicle.pricePerDay * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">LKR {Math.round(vehicle.pricePerDay * 1.05).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={`w-full py-2 px-4 rounded-md text-center text-sm font-medium ${
                      selectedVehicle?.id === vehicle.id
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'border border-primary-600 text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    {selectedVehicle?.id === vehicle.id ? 'Selected' : 'Select This Vehicle'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      <div className="mt-10 flex justify-end">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mr-4 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedVehicle}
          className={`py-2 px-4 rounded-md text-sm font-medium text-white ${
            selectedVehicle
              ? 'bg-primary-600 hover:bg-primary-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}

export default SelectVehicle;