import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import tripPlanningService from '../../services/tripPlanningService';
import GoogleMapSelector from '../../components/maps/GoogleMapSelector';
import TripRouteMap from '../../components/maps/TripRouteMap';

function MultiDestinationTripPlanner() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Trip data
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStops, setSelectedStops] = useState([
    { destinationId: '', day: 1, overnightStay: false, notes: '' }
  ]);

  // Trip details
  const [tripDetails, setTripDetails] = useState({
    totalDistance: 0,
    totalDuration: 0,
    totalDays: 0,
    estimatedCost: 0
  });

  // Fetch all destinations
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        const result = await tripPlanningService.getAllDestinations();

        if (result && result.success) {
          setDestinations(result.data);
        } else {
          throw new Error('Failed to fetch destinations');
        }
      } catch (err) {
        console.error('Error fetching destinations:', err);
        setError(err.message || 'Failed to load destinations');
        toast.error('Failed to load destinations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  // Add custom destination to destinations list
  const addCustomDestination = useCallback((customDestination) => {
    // Check if we already have this custom destination
    const exists = destinations.some(d =>
      d.destination_id === customDestination.destination_id ||
      d.name.toLowerCase() === customDestination.name.toLowerCase()
    );

    if (!exists) {
      setDestinations(prev => [...prev, customDestination]);
    }
  }, [destinations]);

  // Add a new stop
  const addStop = () => {
    setSelectedStops([
      ...selectedStops,
      {
        destinationId: '',
        day: selectedStops.length > 0 ? selectedStops[selectedStops.length - 1].day + 1 : 1,
        overnightStay: false,
        notes: ''
      }
    ]);
  };

  // Remove a stop
  const removeStop = (index) => {
    if (selectedStops.length > 1) {
      const updatedStops = [...selectedStops];
      updatedStops.splice(index, 1);

      // Update day numbers
      updatedStops.forEach((stop, i) => {
        stop.day = i + 1;
      });

      setSelectedStops(updatedStops);
    } else {
      toast.warning('You need at least one destination');
    }
  };

  // Handle stop change
  const handleStopChange = (index, field, value) => {
    const updatedStops = [...selectedStops];
    updatedStops[index][field] = value;
    setSelectedStops(updatedStops);
  };

  // Calculate trip details
  const calculateTripDetails = async () => {
    try {
      // Validate that all destinations are selected
      const invalidStops = selectedStops.filter(stop => !stop.destinationId);
      if (invalidStops.length > 0) {
        toast.error('Please select all destinations');
        return;
      }

      // Extract destination IDs
      const destinationIds = selectedStops.map(stop => parseInt(stop.destinationId));

      // Calculate trip details
      const details = await tripPlanningService.calculateTripDetails(destinationIds);

      setTripDetails(details);

      toast.success('Trip details calculated successfully');
    } catch (err) {
      console.error('Error calculating trip details:', err);
      toast.error('Failed to calculate trip details. Please try again.');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate form
      if (!startDate || !endDate) {
        toast.error('Please select start and end dates');
        return;
      }

      // Validate that all destinations are selected
      const invalidStops = selectedStops.filter(stop => !stop.destinationId);
      if (invalidStops.length > 0) {
        toast.error('Please select all destinations');
        return;
      }

      // Create trip
      const tripData = {
        startDate,
        endDate,
        totalDistance: tripDetails.totalDistance,
        totalDays: tripDetails.totalDays,
        estimatedCost: tripDetails.estimatedCost
      };

      const tripResult = await tripPlanningService.createTrip(tripData);

      if (!tripResult || !tripResult.success) {
        throw new Error('Failed to create trip');
      }

      const tripId = tripResult.data.tripId;

      // Add stops
      for (let i = 0; i < selectedStops.length; i++) {
        const stop = selectedStops[i];

        const stopData = {
          destinationId: stop.destinationId,
          stopOrder: i + 1,
          tripDay: stop.day,
          overnightStay: stop.overnightStay,
          stopNotes: stop.notes
        };

        await tripPlanningService.addTripStop(tripId, stopData);
      }

      // Store trip data in session storage for next steps
      sessionStorage.setItem('currentTripId', tripId);
      sessionStorage.setItem('tripDetails', JSON.stringify({
        ...tripData,
        stops: selectedStops.map((stop, index) => ({
          ...stop,
          stopOrder: index + 1,
          destinationName: destinations.find(d => d.destination_id === parseInt(stop.destinationId))?.name
        }))
      }));

      toast.success('Trip planned successfully!');

      // Navigate to trip preferences page
      navigate('/trip-preferences');
    } catch (err) {
      console.error('Error planning trip:', err);
      toast.error('Failed to plan trip. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Error loading destinations</h3>
        <p className="mt-1 text-gray-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Plan Your Multi-Destination Trip</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Trip Details</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-4">Destinations</h3>

          {/* Google Maps Integration */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-2">Select destinations on the map</h4>
            <GoogleMapSelector
              destinations={destinations}
              selectedDestinations={selectedStops}
              onDestinationSelect={(destination) => {
                // If this is a custom destination, add it to our destinations list
                if (destination.destination_id && destination.destination_id.toString().startsWith('custom-')) {
                  addCustomDestination(destination);
                }

                // Find the first empty stop or add a new one
                const emptyStopIndex = selectedStops.findIndex(stop => !stop.destinationId);
                if (emptyStopIndex !== -1) {
                  handleStopChange(emptyStopIndex, 'destinationId', destination.destination_id.toString());
                } else {
                  addStop();
                  setTimeout(() => {
                    handleStopChange(selectedStops.length, 'destinationId', destination.destination_id.toString());
                  }, 0);
                }
                toast.success(`Added ${destination.name} to your trip`);
              }}
            />
          </div>

          {selectedStops.map((stop, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Stop {index + 1}</h4>

                <button
                  type="button"
                  onClick={() => removeStop(index)}
                  className="text-red-500 hover:text-red-700"
                  disabled={selectedStops.length === 1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`destination-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Destination <span className="text-red-500">*</span>
                  </label>
                  <select
                    id={`destination-${index}`}
                    value={stop.destinationId}
                    onChange={(e) => handleStopChange(index, 'destinationId', e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select a destination</option>
                    {destinations.map((destination) => (
                      <option key={destination.destination_id} value={destination.destination_id}>
                        {destination.name} {destination.province === 'Custom Location'
                          ? '(Custom Location)'
                          : `(${destination.province})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`day-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Day
                  </label>
                  <input
                    type="number"
                    id={`day-${index}`}
                    value={stop.day}
                    onChange={(e) => handleStopChange(index, 'day', parseInt(e.target.value))}
                    min="1"
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`overnight-${index}`}
                      checked={stop.overnightStay}
                      onChange={(e) => handleStopChange(index, 'overnightStay', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`overnight-${index}`} className="ml-2 block text-sm text-gray-700">
                      Overnight Stay
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor={`notes-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    id={`notes-${index}`}
                    value={stop.notes}
                    onChange={(e) => handleStopChange(index, 'notes', e.target.value)}
                    rows="2"
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Any special requests or notes for this stop"
                  ></textarea>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between mb-8">
            <button
              type="button"
              onClick={addStop}
              className="inline-flex items-center px-4 py-2 border border-primary-600 text-sm font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Another Destination
            </button>

            <button
              type="button"
              onClick={calculateTripDetails}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculate Trip Details
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Trip Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Total Distance</p>
                <p className="text-lg font-medium">{(tripDetails.totalDistance || 0).toFixed(1)} km</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Duration</p>
                <p className="text-lg font-medium">{(tripDetails.totalDuration || 0).toFixed(1)} hours</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated Days</p>
                <p className="text-lg font-medium">{tripDetails.totalDays || 0} days</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated Cost</p>
                <p className="text-lg font-medium">LKR {Math.round(tripDetails.estimatedCost || 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Trip Route Map */}
            {selectedStops.some(stop => stop.destinationId) && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-2">Your Trip Route</h4>
                <TripRouteMap
                  destinations={destinations}
                  selectedStops={selectedStops}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Continue to Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MultiDestinationTripPlanner;
