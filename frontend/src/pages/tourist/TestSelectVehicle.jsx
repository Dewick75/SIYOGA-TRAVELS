import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

function TestSelectVehicle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [destination, setDestination] = useState(null);

  // Enhanced filter options
  const [filterType, setFilterType] = useState('');
  const [filterCapacity, setFilterCapacity] = useState('');
  const [filterPriceRange, setFilterPriceRange] = useState('');
  const [filterFeatures, setFilterFeatures] = useState([]);
  const [sortBy, setSortBy] = useState('price');

  // Direct API call to fetch vehicles from the database
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching vehicles from database...');

      // Get trip details from session storage or use defaults
      let tripData = {
        date: new Date().toISOString().split('T')[0],
        time: "09:00",
        numTravelers: 2,
        destinationId: 1
      };

      const storedTripDetails = sessionStorage.getItem('tripDetails');
      if (storedTripDetails) {
        try {
          const parsedTrip = JSON.parse(storedTripDetails);
          tripData = {
            ...tripData,
            ...parsedTrip
          };
          setTripDetails(parsedTrip);
          console.log('Using stored trip details:', parsedTrip);
        } catch (err) {
          console.error('Error parsing stored trip details:', err);
        }
      } else {
        setTripDetails(tripData);
        console.log('Using default trip details:', tripData);
      }

      // Get destination from session storage or use defaults
      let destinationData = {
        id: 1,
        name: "Kandy",
        location: "Central Province",
        description: "Beautiful hill country with the Temple of the Tooth Relic",
        imageUrl: "https://via.placeholder.com/800x400?text=Kandy"
      };

      const storedDestination = sessionStorage.getItem('selectedDestination');
      if (storedDestination) {
        try {
          const parsedDestination = JSON.parse(storedDestination);
          destinationData = parsedDestination;
          setDestination(parsedDestination);
          console.log('Using stored destination:', parsedDestination);
        } catch (err) {
          console.error('Error parsing stored destination:', err);
        }
      } else {
        setDestination(destinationData);
        console.log('Using default destination:', destinationData);
      }

      // Fetch real vehicle data from the database
      console.log('Fetching real vehicles from database...');

      try {
        const response = await axios.get('http://localhost:5000/api/vehicles', {
          timeout: 8000 // 8 second timeout
        });

        console.log('API response from vehicles endpoint:', response.data);

        if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
          console.log('Successfully fetched vehicles from database:', response.data.data);
          const formattedVehicles = formatVehiclesFromAPI(response.data.data);
          setVehicles(formattedVehicles);
        } else {
          console.log('No vehicles found in the database');
          throw new Error('No vehicles found in the database');
        }
      } catch (err) {
        console.error('Error fetching vehicles from database:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response ? {
            status: err.response.status,
            data: err.response.data
          } : 'No response',
          request: err.request ? 'Request was made but no response received' : 'No request'
        });
        throw new Error('Failed to fetch vehicles from database: ' + err.message);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Failed to load vehicles from database. ' + err.message);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format vehicle data from API
  const formatVehiclesFromAPI = (vehiclesData) => {
    console.log(`Formatting ${vehiclesData.length} vehicles from database`);

    // If vehiclesData is empty or undefined, return empty array
    if (!vehiclesData || vehiclesData.length === 0) {
      console.log('No vehicles data from database');
      return [];
    }

    const formattedVehicles = vehiclesData.map(vehicle => ({
      id: vehicle.VehicleID,
      type: vehicle.Type,
      make: vehicle.Make,
      model: vehicle.Model,
      year: vehicle.Year,
      licensePlate: vehicle.LicensePlate,
      capacity: vehicle.Capacity,
      features: Array.isArray(vehicle.Features) ? vehicle.Features :
               (typeof vehicle.Features === 'string' ? JSON.parse(vehicle.Features) : []),
      driverName: vehicle.DriverName,
      driverRating: vehicle.DriverRating,
      driverId: vehicle.DriverID,
      trips: vehicle.DriverTotalTrips || 0,
      pricePerDay: vehicle.PricePerDay,
      status: vehicle.Status,
      imageUrl: vehicle.ImageURL || `https://via.placeholder.com/300x200?text=${vehicle.Make}+${vehicle.Model}`
    }));

    console.log('Formatted vehicles from database:', formattedVehicles);
    return formattedVehicles;
  };

  useEffect(() => {
    console.log('TestSelectVehicle component mounted');

    // Fetch real data from the database
    fetchVehicles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



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

    // Apply price range filter
    if (filterPriceRange) {
      const [min, max] = filterPriceRange.split('-').map(Number);
      filtered = filtered.filter(v => v.pricePerDay >= min && (max ? v.pricePerDay <= max : true));
    }

    // Apply features filter
    if (filterFeatures.length > 0) {
      filtered = filtered.filter(vehicle =>
        filterFeatures.every(feature =>
          vehicle.features.some(vf =>
            vf.toLowerCase().includes(feature.toLowerCase())
          )
        )
      );
    }

    // Apply sorting
    if (sortBy === 'price') {
      filtered.sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.driverRating - a.driverRating);
    } else if (sortBy === 'capacity') {
      filtered.sort((a, b) => b.capacity - a.capacity);
    } else if (sortBy === 'year') {
      filtered.sort((a, b) => b.year - a.year);
    }

    return filtered;
  };

  const filteredVehicles = getFilteredVehicles();

  const handleContinue = () => {
    if (!selectedVehicle) {
      alert('Please select a vehicle to continue');
      return;
    }

    // Navigate to payment method page with trip data and selected vehicle
    navigate('/test/payment-method', {
      state: {
        tripData: {
          destination: destination?.name || 'Unknown Destination',
          destinationId: destination?.id || 1,
          date: tripDetails?.date,
          time: tripDetails?.time,
          numTravelers: tripDetails?.numTravelers,
          specialRequests: tripDetails?.notes || ''
        },
        selectedVehicle: {
          ...selectedVehicle,
          VehicleID: selectedVehicle.id,
          Make: selectedVehicle.make,
          Model: selectedVehicle.model,
          Type: selectedVehicle.type,
          LicensePlate: selectedVehicle.licensePlate,
          PricePerDay: selectedVehicle.pricePerDay,
          DriverID: selectedVehicle.driverId,
          DriverName: selectedVehicle.driverName
        }
      }
    });

    toast.success(`Selected ${selectedVehicle.make} ${selectedVehicle.model}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Show error banner if we have an error
  const ErrorBanner = () => {
    if (error) {
      return (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="text-red-700 font-medium">{error}</span>
                <p className="mt-1 text-sm text-red-600">
                  {vehicles.length > 0
                    ? "Showing available vehicles from our database. Some options may not be up-to-date."
                    : "We couldn't find any vehicles in the database matching your criteria. Please try adjusting your search parameters or contact support."}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setError(null);
                fetchVehicles();
              }}
              className="ml-4 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium rounded-md"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Select a Vehicle</h1>
        <p className="text-gray-600 mt-1">Choose from our fleet of vehicles for your trip</p>
        {destination && tripDetails && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-gray-700">
                  <span className="font-semibold">Trip to:</span> {destination.name}, {destination.location}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Date & Time:</span> {new Date(tripDetails.date).toLocaleDateString()} at {tripDetails.time}
                </p>
              </div>
              <div className="mt-2 md:mt-0">
                <p className="text-gray-700">
                  <span className="font-semibold">Number of travelers:</span> {tripDetails.numTravelers}
                </p>
                {tripDetails.pickupLocation && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Pickup:</span> {tripDetails.pickupLocation}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Display error banner if there's an error but we have vehicles */}
      <ErrorBanner />

      <div className="mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Filter Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Vehicle Type Filter */}
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

            {/* Capacity Filter */}
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

            {/* Price Range Filter */}
            <div>
              <label htmlFor="filterPriceRange" className="block text-sm font-medium text-gray-700 mb-1">
                Price Range (LKR)
              </label>
              <select
                id="filterPriceRange"
                value={filterPriceRange}
                onChange={(e) => setFilterPriceRange(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Any Price</option>
                <option value="0-5000">Up to 5,000</option>
                <option value="5000-10000">5,000 - 10,000</option>
                <option value="10000-15000">10,000 - 15,000</option>
                <option value="15000">15,000+</option>
              </select>
            </div>

            {/* Sort By */}
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
                <option value="year">Year (Newest First)</option>
              </select>
            </div>
          </div>

          {/* Features Filter */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Features
            </label>
            <div className="flex flex-wrap gap-2">
              {['Air Conditioning', 'Bluetooth', 'USB Charging', 'Spacious', 'Economical'].map(feature => (
                <button
                  key={feature}
                  type="button"
                  onClick={() => {
                    if (filterFeatures.includes(feature)) {
                      setFilterFeatures(filterFeatures.filter(f => f !== feature));
                    } else {
                      setFilterFeatures([...filterFeatures, feature]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    filterFeatures.includes(feature)
                      ? 'bg-primary-100 text-primary-800 border border-primary-300'
                      : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No vehicles found</h3>
          <p className="mt-1 text-gray-500">Try adjusting your filters to see more options.</p>
          <div className="mt-4">
            <button
              onClick={() => {
                // Reset filters
                setFilterType('');
                setFilterCapacity('');
                setFilterPriceRange('');
                setFilterFeatures([]);
                // Refresh data
                fetchVehicles();
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
            >
              Reset Filters & Refresh
            </button>
          </div>
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
                  <div className="flex items-center mt-1">
                    <span className="text-sm text-gray-500">{vehicle.type} • {vehicle.year}</span>
                    {vehicle.licensePlate && (
                      <>
                        <span className="mx-1.5 text-gray-300">|</span>
                        <span className="text-sm text-gray-500">License: {vehicle.licensePlate}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {vehicle.capacity} Passengers
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {vehicle.year} Model
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900">Features:</h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {vehicle.features && vehicle.features.length > 0 ? (
                      vehicle.features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          <svg className="h-3 w-3 text-primary-500 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No features listed</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-6 border-t md:border-t-0 md:border-l border-r-0 md:border-r border-gray-200 flex flex-col">
                {/* Vehicle Image */}
                <div className="mb-4">
                  <img
                    src={vehicle.imageUrl}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-full h-40 object-cover rounded-md shadow-sm"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://via.placeholder.com/300x200?text=${vehicle.make}+${vehicle.model}`;
                    }}
                  />
                </div>

                {/* Driver Information */}
                <div className="mt-auto">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Driver Information</h3>
                  <div className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                      <svg className="h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{vehicle.driverName || 'Driver Information Unavailable'}</h3>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          <svg className="h-4 w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="ml-1 text-sm text-gray-600">{vehicle.driverRating ? vehicle.driverRating.toFixed(1) : 'N/A'}</span>
                        </div>
                        <span className="mx-1.5 text-gray-500">•</span>
                        <span className="text-sm text-gray-600">{vehicle.trips ? `${vehicle.trips} trips` : 'New Driver'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-6 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col justify-between">
                {/* Pricing Information */}
                <div>
                  <div className="text-2xl font-bold text-gray-900">LKR {vehicle.pricePerDay.toLocaleString()}</div>
                  <p className="text-sm text-gray-500">per day</p>
                </div>

                <div className="mt-4 space-y-2 bg-gray-50 p-3 rounded-md">
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

                {/* Availability Status */}
                <div className="mt-4">
                  <div className="flex items-center">
                    {vehicle.status && vehicle.status !== 'Active' ? (
                      <>
                        <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-sm text-red-700 font-medium">{vehicle.status}</span>
                      </>
                    ) : (
                      <>
                        <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-green-700 font-medium">Available for your trip</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Select Button */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={`w-full py-3 px-4 rounded-md text-center text-sm font-medium ${
                      selectedVehicle?.id === vehicle.id
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : vehicle.status && vehicle.status !== 'Active'
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'border border-primary-600 text-primary-600 hover:bg-primary-50'
                    }`}
                    disabled={vehicle.status && vehicle.status !== 'Active'}
                  >
                    {selectedVehicle?.id === vehicle.id
                      ? 'Selected'
                      : vehicle.status && vehicle.status !== 'Active'
                        ? `${vehicle.status} - Unavailable`
                        : 'Select This Vehicle'
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
          ))}
          {filteredVehicles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 19V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2zM13 5v6m0 0v6m0-6h6m-6 0H7" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No vehicles found in database</h3>
              <p className="mt-1 text-sm text-gray-500">
                We couldn't find any vehicles matching your criteria in the database.
              </p>
              <button
                onClick={() => {
                  // Reset filters
                  setFilterType('');
                  setFilterCapacity('');
                  setFilterPriceRange('');
                  setFilterFeatures([]);
                  // Refresh data
                  fetchVehicles();
                }}
                className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Reset Filters & Retry
              </button>
            </div>
          )}
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

export default TestSelectVehicle;
