import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

function TripDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    // In a real app, this would be an API call
    // For now, let's use mock data
    setTimeout(() => {
      if (bookingId === 'BK123456') {
        setBooking({
          id: 'BK123456',
          status: 'upcoming',
          date: '2023-07-15',
          time: '09:00',
          destination: {
            name: 'Sigiriya Rock Fortress',
            location: 'Dambulla, Central Province',
            description: 'An ancient rock fortress and palace with stunning views.'
          },
          vehicle: {
            make: 'Toyota',
            model: 'Corolla',
            type: 'Car',
            licensePlate: 'CAB-1234',
            capacity: 4,
            imageUrl: 'https://via.placeholder.com/300x200?text=Toyota+Corolla'
          },
          driver: {
            name: 'Rahul Perera',
            phone: '+94 71 234 5678',
            rating: 4.8
          },
          tripDetails: {
            numTravelers: 3,
            notes: 'We would like to stop for lunch around 1 PM if possible.'
          },
          totalAmount: 5250,
          paymentMethod: 'Credit Card',
          bookingDate: '2023-06-10'
        });
        setLoading(false);
      } else if (bookingId === 'BK789012') {
        setBooking({
          id: 'BK789012',
          status: 'completed',
          date: '2023-06-20',
          time: '10:30',
          destination: {
            name: 'Galle Fort',
            location: 'Galle, Southern Province',
            description: 'A historic fortified city founded by Portuguese colonists.'
          },
          vehicle: {
            make: 'Honda',
            model: 'CR-V',
            type: 'SUV',
            licensePlate: 'CAB-5678',
            capacity: 7,
            imageUrl: 'https://via.placeholder.com/300x200?text=Honda+CRV'
          },
          driver: {
            name: 'Nihal Jayawardene',
            phone: '+94 77 345 6789',
            rating: 4.9
          },
          tripDetails: {
            numTravelers: 5,
            notes: ''
          },
          totalAmount: 7875,
          paymentMethod: 'PayPal',
          bookingDate: '2023-06-01'
        });
        setLoading(false);
      } else {
        setError('Booking not found');
        setLoading(false);
      }
    }, 1000);
  }, [bookingId]);
  
  const handleCancellationClick = () => {
    setShowCancellationModal(true);
  };

  const handleCancellationClose = () => {
    setShowCancellationModal(false);
    setCancellationReason('');
  };

  const handleCancellationReasonChange = (e) => {
    setCancellationReason(e.target.value);
  };

  const handleCancelTrip = async () => {
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }
    
    setIsCancelling(true);
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate back to dashboard
      navigate('/tourist/dashboard', { 
        state: { 
          cancellationSuccess: true,
          bookingId: booking.id
        } 
      });
    } catch  {
      alert('Failed to cancel trip. Please try again.');
      setIsCancelling(false);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-10">
          <div className="text-red-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">{error}</h3>
          <button 
            onClick={() => navigate('/tourist/dashboard')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking #{booking.id}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Booked on {new Date(booking.bookingDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center">
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
            booking.status === 'upcoming' 
              ? 'bg-blue-100 text-blue-800' 
              : booking.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="border-b border-gray-200 px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Trip Details</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Destination</h4>
              <p className="mt-1 text-lg font-medium text-gray-900">{booking.destination.name}</p>
              <p className="text-sm text-gray-500">{booking.destination.location}</p>
              <p className="mt-2 text-sm text-gray-700">{booking.destination.description}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Date & Time</h4>
              <p className="mt-1 text-lg font-medium text-gray-900">
                {new Date(booking.date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">Pickup time: {booking.time}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Travelers</h4>
              <p className="mt-1 text-lg font-medium text-gray-900">{booking.tripDetails.numTravelers} people</p>
              {booking.tripDetails.notes && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-500">Special Requests:</p>
                  <p className="text-sm text-gray-700">{booking.tripDetails.notes}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900">Vehicle & Driver</h4>
            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-24 w-24 bg-gray-200 rounded-md overflow-hidden">
                  <img 
                    src={booking.vehicle.imageUrl} 
                    alt={`${booking.vehicle.make} ${booking.vehicle.model}`} 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="ml-4">
                  <p className="text-lg font-medium text-gray-900">{booking.vehicle.make} {booking.vehicle.model}</p>
                  <p className="text-sm text-gray-500">
                    {booking.vehicle.type} • {booking.vehicle.capacity} passengers
                  </p>
                  <p className="text-sm text-gray-500">License Plate: {booking.vehicle.licensePlate}</p>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-500">Driver Information</h5>
                <p className="mt-1 text-lg font-medium text-gray-900">{booking.driver.name}</p>
                <div className="mt-1 flex items-center">
                  <svg className="h-4 w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-sm text-gray-600">{booking.driver.rating}</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  <span className="font-medium">Contact: </span>
                  {booking.driver.phone}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900">Payment Information</h4>
            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-6">
              <div>
                <h5 className="text-sm font-medium text-gray-500">Total Amount</h5>
                <p className="mt-1 text-lg font-medium text-gray-900">LKR {booking.totalAmount.toLocaleString()}</p>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-500">Payment Method</h5>
                <p className="mt-1 text-lg font-medium text-gray-900">{booking.paymentMethod}</p>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-500">Payment Status</h5>
                <p className="mt-1 text-lg font-medium text-green-600">Paid</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between">
          <Link
            to="/tourist/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          
          {booking.status === 'upcoming' && (
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => navigate(`/modify-booking/${booking.id}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50"
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Modify Booking
              </button>
              
              <button
                type="button"
                onClick={handleCancellationClick}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel Trip
              </button>
            </div>
          )}
          
          {booking.status === 'completed' && !booking.reviewed && (
            <button
              type="button"
              onClick={() => navigate(`/review-trip/${booking.id}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Leave a Review
            </button>
          )}
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancellationModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Cancel Trip
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to cancel this trip? This action cannot be undone.
                      </p>
                      <div className="mt-4">
                        <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700">
                          Reason for Cancellation
                        </label>
                        <textarea
                          id="cancellationReason"
                          name="cancellationReason"
                          rows="3"
                          value={cancellationReason}
                          onChange={handleCancellationReasonChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="Please explain why you're cancelling this trip..."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCancelTrip}
                  disabled={isCancelling}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${
                    isCancelling ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isCancelling ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cancelling...
                    </>
                  ) : (
                    'Confirm Cancellation'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancellationClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TripDetail;