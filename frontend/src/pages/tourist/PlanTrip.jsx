import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import destinationService from '../../services/destinationService';
import tripService from '../../services/tripService';

function PlanTrip() {
  const { destinationId } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);
  const [tripDetails, setTripDetails] = useState({
    date: '',
    time: '',
    numTravelers: 1,
    pickupLocation: '',
    dropoffLocation: '',
    notes: '',
    selectedActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDestinationDetails = async () => {
      try {
        setLoading(true);
        const result = await destinationService.getDestinationById(destinationId);

        if (result && result.success) {
          // Transform the data to match our component's expected format
          const dest = result.data;
          const formattedDestination = {
            id: dest.DestinationID,
            name: dest.Name,
            location: dest.Location,
            description: dest.Description,
            imageUrl: destinationService.formatImageUrl(dest.ImageURL),
            activities: dest.Activities || []
          };

          setDestination(formattedDestination);
        } else {
          throw new Error('Failed to fetch destination details');
        }
      } catch (err) {
        console.error('Error fetching destination details:', err);
        setError(err.message || 'Failed to load destination details');
      } finally {
        setLoading(false);
      }
    };

    if (destinationId) {
      fetchDestinationDetails();
    } else {
      setError("No destination ID provided");
      setLoading(false);
    }
  }, [destinationId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTripDetails(prevDetails => ({
      ...prevDetails,
      [name]: value
    }));
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Validate required fields
      if (!tripDetails.date || !tripDetails.time || !tripDetails.numTravelers || !tripDetails.pickupLocation) {
        throw new Error('Please fill in all required fields');
      }

      // Prepare trip data
      const tripData = {
        ...tripDetails,
        destinationId: destination.id,
        activities: tripDetails.selectedActivities.length > 0
          ? tripDetails.selectedActivities
          : destination.activities
      };

      console.log("Storing trip data in session storage:", tripData);
      console.log("Storing destination in session storage:", destination);

      // Always store the destination and trip details in session storage
      sessionStorage.setItem('selectedDestination', JSON.stringify(destination));
      sessionStorage.setItem('tripDetails', JSON.stringify(tripData));

      try {
        // Try to save trip plan to backend and get available vehicles
        const result = await tripService.planTrip(tripData);

        if (result && result.success) {
          // If available vehicles were returned, store them too
          if (result.data && result.data.availableVehicles) {
            console.log("Storing available vehicles in session storage:", result.data.availableVehicles);
            sessionStorage.setItem('availableVehicles', JSON.stringify(result.data.availableVehicles));
          }
        }
      } catch (apiErr) {
        console.error('API error planning trip:', apiErr);
        // Don't throw here, we'll continue with the flow even if the API fails
      }

      // Navigate to test vehicle selection page instead of regular vehicle selection
      navigate('/test/select-vehicle');
    } catch (err) {
      console.error('Error planning trip:', err);
      setSubmitError(err.message || 'Failed to plan trip. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="text-center py-10">
        <div className="text-red-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Destination not found</h3>
        <p className="mt-1 text-gray-500">{error || "The requested destination does not exist."}</p>
        <button
          onClick={() => navigate('/destinations')}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Back to Destinations
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
          <img
            src={destination.imageUrl}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black opacity-60"></div>
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-2xl md:text-4xl font-bold text-white">{destination.name}</h1>
            <p className="text-lg text-white mt-2">{destination.location}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About this destination</h2>
            <p className="text-gray-700">{destination.description}</p>

            {destination.activities && destination.activities.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Activities</h3>
                <ul className="list-disc pl-5 text-gray-700">
                  {destination.activities.map((activity, index) => (
                    <li key={index}>{activity}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Plan Your Trip</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Select Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={tripDetails.date}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                    Select Time <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="time"
                    name="time"
                    required
                    value={tripDetails.time}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Select a time</option>
                    <option value="06:00">6:00 AM</option>
                    <option value="07:00">7:00 AM</option>
                    <option value="08:00">8:00 AM</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="numTravelers" className="block text-sm font-medium text-gray-700">
                    Number of Travelers <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="numTravelers"
                    name="numTravelers"
                    min="1"
                    max="20"
                    required
                    value={tripDetails.numTravelers}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700">
                    Pickup Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="pickupLocation"
                    name="pickupLocation"
                    required
                    value={tripDetails.pickupLocation}
                    onChange={handleChange}
                    placeholder="Enter your pickup location"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="dropoffLocation" className="block text-sm font-medium text-gray-700">
                    Drop-off Location
                  </label>
                  <input
                    type="text"
                    id="dropoffLocation"
                    name="dropoffLocation"
                    value={tripDetails.dropoffLocation}
                    onChange={handleChange}
                    placeholder="Same as pickup if left empty"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                {destination.activities && destination.activities.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Activities
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md">
                      {destination.activities.map((activity, index) => (
                        <div key={index} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`activity-${index}`}
                            name="selectedActivities"
                            value={activity}
                            checked={tripDetails.selectedActivities.includes(activity)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setTripDetails(prev => ({
                                ...prev,
                                selectedActivities: isChecked
                                  ? [...prev.selectedActivities, activity]
                                  : prev.selectedActivities.filter(a => a !== activity)
                              }));
                            }}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`activity-${index}`} className="ml-2 block text-sm text-gray-700">
                            {activity}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="3"
                    value={tripDetails.notes}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Any special requirements or requests..."
                  ></textarea>
                </div>

                {submitError && (
                  <div className="text-red-600 text-sm mb-4 p-2 bg-red-50 rounded border border-red-200">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {submitError}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black ${
                      submitting
                        ? 'bg-primary-400 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Continue to Vehicle Selection'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanTrip;