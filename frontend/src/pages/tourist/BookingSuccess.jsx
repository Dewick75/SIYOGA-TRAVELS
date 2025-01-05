import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

function BookingSuccess() {
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

  const handlePrint = () => {
    window.print();
    toast.success('Booking details printed successfully!');
  };

  const handleBookAnother = () => {
    navigate('/destinations');
  };

  if (!bookingData) {
    return null;
  }

  const { bookingNumber, tripData, selectedVehicle, paymentMethod } = bookingData;
  const totalAmount = selectedVehicle.PricePerDay;

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

      <div className="mt-10">
        <div className="bg-white shadow overflow-hidden rounded-lg">
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
                <p className="mt-1 text-lg font-medium text-gray-900">{tripData.destination}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  {tripData.date}
                </p>
                <p className="text-sm text-gray-500">Pick-up time: {tripData.time}</p>
              </div>

              <div className="sm:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Vehicle</h3>
                <div className="mt-1 flex items-center">
                  <div className="ml-4">
                    <p className="text-lg font-medium text-gray-900">{selectedVehicle.Make} {selectedVehicle.Model}</p>
                    <p className="text-sm text-gray-500">{selectedVehicle.Type} • License: {selectedVehicle.LicensePlate}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Driver</h3>
                <p className="mt-1 text-lg font-medium text-gray-900">{selectedVehicle.DriverName || 'Assigned Driver'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Travelers</h3>
                <p className="mt-1 text-lg font-medium text-gray-900">{tripData.numTravelers}</p>
              </div>

              {tripData.specialRequests && (
                <div className="sm:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Special Requests</h3>
                  <p className="mt-1 text-base text-gray-900">{tripData.specialRequests}</p>
                </div>
              )}

              <div className="sm:col-span-2 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-500">Payment Summary</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Vehicle rental</span>
                    <span className="text-gray-900">LKR {totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Driver fee</span>
                    <span className="text-gray-900">Included</span>
                  </div>
                  <div className="flex justify-between text-base font-medium pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total paid</span>
                    <span className="text-gray-900">LKR {totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-gray-500">Payment Method</span>
                    <span className="text-gray-900">{paymentMethod}</span>
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
      </div>

      <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 justify-center">
        <button
          type="button"
          onClick={handleBookAnother}
          className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-black bg-primary-600 hover:bg-primary-700"
        >
          Book Another Trip
        </button>
        <button
          type="button"
          onClick={handlePrint}
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

export default BookingSuccess;
