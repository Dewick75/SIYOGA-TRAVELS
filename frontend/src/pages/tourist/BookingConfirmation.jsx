import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    // Check if we have booking data in the location state
    if (!location.state || !location.state.bookingNumber) {
      navigate('/destinations');
      return;
    }

    setBookingData(location.state);
  }, [location, navigate]);

  if (!bookingData) {
    return null;
  }

  const { bookingNumber, destination, tripDetails, vehicle } = bookingData;
  const totalAmount = Math.round(vehicle.pricePerDay * 1.05);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg className="h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Booking Confirmed!</h1>
        <p className="mt-2 text-lg text-gray-600">
          Thank you for booking with Siyoga Travels. Your trip is all set!
        </p>
      </div>

      <div className="mt-10 bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Booking Details</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Your booking number is <span className="font-medium text-primary-600">{bookingNumber}</span>
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 gap-x-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Destination</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">{destination.name}</p>
              <p className="text-sm text-gray-500">{destination.location}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">
                {new Date(tripDetails.date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">Pick-up time: {tripDetails.time}</p>
            </div>
            
            <div className="sm:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Vehicle</h3>
              <div className="mt-1 flex items-center">
                <div className="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-md overflow-hidden">
                  <img 
                    src={vehicle.imageUrl} 
                    alt={`${vehicle.make} ${vehicle.model}`} 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="ml-4">
                  <p className="text-lg font-medium text-gray-900">{vehicle.make} {vehicle.model}</p>
                  <p className="text-sm text-gray-500">{vehicle.type} • {vehicle.capacity} passengers</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Driver</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">{vehicle.driverName}</p>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="ml-1 text-sm text-gray-600">{vehicle.driverRating}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Travelers</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">{tripDetails.numTravelers}</p>
            </div>

            {tripDetails.notes && (
              <div className="sm:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Special Requests</h3>
                <p className="mt-1 text-base text-gray-900">{tripDetails.notes}</p>
              </div>
            )}
            
            <div className="sm:col-span-2 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-500">Payment Summary</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Vehicle rental</span>
                  <span className="text-gray-900">LKR {vehicle.pricePerDay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Driver fee</span>
                  <span className="text-gray-900">Included</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service fee</span>
                  <span className="text-gray-900">LKR {Math.round(vehicle.pricePerDay * 0.05).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-medium pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total paid</span>
                  <span className="text-gray-900">LKR {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Your driver will contact you before the trip. If you need to contact your driver, you can do so through your dashboard.</p>
              <p className="mt-1">Please be ready at the pick-up time. Your driver will wait for up to 15 minutes after the scheduled time.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 justify-center">
        <Link
          to="/tourist/dashboard"
          className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          Go to Dashboard
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
       >
         <svg className="mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
         </svg>
         Print Details
       </button>
     </div>
   </div>
 );
}

export default BookingConfirmation;