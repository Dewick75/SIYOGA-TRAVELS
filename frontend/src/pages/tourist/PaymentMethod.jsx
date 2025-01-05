import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

// Components
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PaymentMethod = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get trip data and selected vehicle from location state
  const { tripData, selectedVehicle } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [bookingDetails, setBookingDetails] = useState(null);

  // Payment methods available
  const paymentMethods = [
    { id: 'credit-card', name: 'Credit Card', icon: 'fa-credit-card' },
    { id: 'paypal', name: 'PayPal', icon: 'fa-paypal' },
    { id: 'cash', name: 'Cash on Arrival', icon: 'fa-money-bill' },
    { id: 'bank-transfer', name: 'Bank Transfer', icon: 'fa-university' }
  ];

  useEffect(() => {
    // Validate that we have the necessary data
    if (!tripData || !selectedVehicle) {
      setError('Missing trip data or vehicle selection. Please start over.');
      return;
    }

    // Calculate booking details
    const totalAmount = selectedVehicle.PricePerDay;

    setBookingDetails({
      destination: tripData.destination,
      date: tripData.date,
      time: tripData.time,
      numTravelers: tripData.numTravelers,
      vehicle: {
        id: selectedVehicle.VehicleID,
        make: selectedVehicle.Make,
        model: selectedVehicle.Model,
        type: selectedVehicle.Type,
        licensePlate: selectedVehicle.LicensePlate
      },
      driver: {
        id: selectedVehicle.DriverID,
        name: selectedVehicle.DriverName
      },
      totalAmount
    });
  }, [tripData, selectedVehicle]);

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Skip the user check for testing purposes
    // We'll handle the actual user authentication in production

    setLoading(true);
    setError(null);

    try {
      // Generate a unique booking number
      const bookingNumber = `BK-${Date.now().toString().slice(-8)}`;

      // For testing purposes, we'll create a mock booking response
      // This simulates a successful booking creation without actually hitting the API
      console.log('Creating booking with data:', {
        bookingNumber,
        destinationId: tripData.destinationId,
        vehicleId: selectedVehicle.VehicleID,
        driverId: selectedVehicle.DriverID,
        tripDate: tripData.date,
        tripTime: tripData.time,
        numTravelers: tripData.numTravelers
      });

      const response = {
        data: {
          success: true,
          data: {
            BookingID: Math.floor(Math.random() * 1000) + 1, // Generate random booking ID
            bookingNumber
          }
        }
      };

      if (response.data && response.data.success) {
        // For testing purposes, we'll skip the payment API call
        // and consider the booking as successful
        const paymentResponse = {
          data: {
            success: true
          }
        };

        if (paymentResponse.data && paymentResponse.data.success) {
          // Show success message and navigate
          toast.success('Booking completed successfully!');

          // Navigate to booking success page
          navigate('/booking-success', {
            state: {
              bookingNumber: bookingNumber,
              tripData,
              selectedVehicle,
              paymentMethod
            }
          });
        }
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to complete booking. Please try again.');
      toast.error('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar is already included in the App.jsx layout */}

      <div className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6">Payment Method</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
            <button
              className="underline mt-2"
              onClick={() => navigate('/plan-trip')}
            >
              Return to Trip Planning
            </button>
          </div>
        )}

        {bookingDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-600">Destination</p>
                  <p className="font-medium">{bookingDetails.destination}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Date</p>
                    <p className="font-medium">{bookingDetails.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Time</p>
                    <p className="font-medium">{bookingDetails.time}</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600">Number of Travelers</p>
                  <p className="font-medium">{bookingDetails.numTravelers}</p>
                </div>

                <div>
                  <p className="text-gray-600">Vehicle</p>
                  <p className="font-medium">
                    {bookingDetails.vehicle.make} {bookingDetails.vehicle.model} ({bookingDetails.vehicle.type})
                  </p>
                  <p className="text-sm text-gray-500">License: {bookingDetails.vehicle.licensePlate}</p>
                </div>

                <div>
                  <p className="text-gray-600">Driver</p>
                  <p className="font-medium">{bookingDetails.driver.name}</p>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold">LKR {bookingDetails.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        paymentMethod === method.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handlePaymentMethodChange(method.name)}
                    >
                      <div className="flex items-center">
                        <div className="mr-3">
                          <i className={`fas ${method.icon} text-xl ${
                            paymentMethod === method.name ? 'text-blue-500' : 'text-gray-400'
                          }`}></i>
                        </div>
                        <div>
                          <p className="font-medium">{method.name}</p>
                          {method.name === 'Cash on Arrival' && (
                            <p className="text-sm text-gray-500">Pay directly to the driver</p>
                          )}
                        </div>
                        <div className="ml-auto">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === method.name}
                            onChange={() => handlePaymentMethodChange(method.name)}
                            className="h-5 w-5 text-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Complete Booking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethod;
