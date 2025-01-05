import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import tripPlanningService from '../../services/tripPlanningService';
import TripRouteMap from '../../components/maps/TripRouteMap';

function TripPreferences() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tripDetails, setTripDetails] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [destinations, setDestinations] = useState([]);

  // Preferences
  const [vehicleType, setVehicleType] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [needGuide, setNeedGuide] = useState(false);
  const [needAccommodation, setNeedAccommodation] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    // Get trip details from session storage
    const storedTripId = sessionStorage.getItem('currentTripId');
    const storedTripDetails = sessionStorage.getItem('tripDetails');

    if (!storedTripId || !storedTripDetails) {
      toast.error('No trip details found. Please plan your trip first.');
      navigate('/multi-destination-trip');
      return;
    }

    setTripId(storedTripId);
    setTripDetails(JSON.parse(storedTripDetails));

    // Fetch destinations for the map
    const fetchDestinations = async () => {
      try {
        const result = await tripPlanningService.getAllDestinations();
        if (result && result.success) {
          setDestinations(result.data);
        }
      } catch (err) {
        console.error('Error fetching destinations:', err);
      }
    };

    fetchDestinations();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Validate form
      if (!vehicleType || !budgetRange) {
        toast.error('Please select vehicle type and budget range');
        return;
      }

      // Save preferences
      const preferencesData = {
        vehicleType,
        budgetRange,
        needGuide,
        needAccommodationHelp: needAccommodation,
        specialRequests
      };

      const result = await tripPlanningService.saveTripPreferences(tripId, preferencesData);

      if (!result || !result.success) {
        throw new Error('Failed to save trip preferences');
      }

      // Store preferences in session storage
      sessionStorage.setItem('tripPreferences', JSON.stringify(preferencesData));

      toast.success('Trip preferences saved successfully!');

      // Navigate to vehicle selection page
      navigate('/test/select-vehicle');
    } catch (err) {
      console.error('Error saving trip preferences:', err);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tripDetails) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Trip Preferences</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Trip Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="text-md font-medium">{new Date(tripDetails.startDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">End Date</p>
            <p className="text-md font-medium">{new Date(tripDetails.endDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Distance</p>
            <p className="text-md font-medium">{tripDetails.totalDistance?.toFixed(1)} km</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estimated Days</p>
            <p className="text-md font-medium">{tripDetails.totalDays} days</p>
          </div>
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-2">Destinations</h3>
        <ul className="list-disc pl-5 mb-4">
          {tripDetails.stops?.map((stop, index) => (
            <li key={index} className="mb-1">
              <span className="font-medium">{stop.destinationName}</span>
              {stop.overnightStay && <span className="ml-2 text-sm text-primary-600">(Overnight Stay)</span>}
              {stop.notes && <p className="text-sm text-gray-500 mt-1">{stop.notes}</p>}
            </li>
          ))}
        </ul>

        {/* Trip Route Map */}
        {tripDetails.stops?.length > 0 && destinations.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-2">Your Trip Route</h4>
            <TripRouteMap
              destinations={destinations}
              selectedStops={tripDetails.stops}
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Preferences</h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['car', 'van', 'suv'].map((type) => (
                  <div key={type} className="relative">
                    <input
                      type="radio"
                      id={`vehicle-${type}`}
                      name="vehicleType"
                      value={type}
                      checked={vehicleType === type}
                      onChange={() => setVehicleType(type)}
                      className="sr-only"
                      required
                    />
                    <label
                      htmlFor={`vehicle-${type}`}
                      className={`block border rounded-lg p-4 cursor-pointer hover:border-primary-500 ${
                        vehicleType === type
                          ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <span className="block text-sm font-medium text-gray-900 capitalize">
                            {type}
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Range <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'low', label: 'Economy', description: 'Basic comfort, affordable rates' },
                  { value: 'medium', label: 'Standard', description: 'Good comfort, moderate rates' },
                  { value: 'luxury', label: 'Premium', description: 'Luxury experience, premium rates' }
                ].map((budget) => (
                  <div key={budget.value} className="relative">
                    <input
                      type="radio"
                      id={`budget-${budget.value}`}
                      name="budgetRange"
                      value={budget.value}
                      checked={budgetRange === budget.value}
                      onChange={() => setBudgetRange(budget.value)}
                      className="sr-only"
                      required
                    />
                    <label
                      htmlFor={`budget-${budget.value}`}
                      className={`block border rounded-lg p-4 cursor-pointer hover:border-primary-500 ${
                        budgetRange === budget.value
                          ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div>
                        <span className="block text-sm font-medium text-gray-900">
                          {budget.label}
                        </span>
                        <span className="block text-sm text-gray-500 mt-1">
                          {budget.description}
                        </span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="needGuide"
                  checked={needGuide}
                  onChange={(e) => setNeedGuide(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="needGuide" className="ml-2 block text-sm text-gray-700">
                  I need a guide for this trip
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="needAccommodation"
                  checked={needAccommodation}
                  onChange={(e) => setNeedAccommodation(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="needAccommodation" className="ml-2 block text-sm text-gray-700">
                  I need help with accommodation arrangements
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-1">
                Special Requests or Requirements
              </label>
              <textarea
                id="specialRequests"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows="4"
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Any special requirements or requests for your trip..."
              ></textarea>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => navigate('/multi-destination-trip')}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Trip Planning
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Continue to Vehicle Selection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TripPreferences;
