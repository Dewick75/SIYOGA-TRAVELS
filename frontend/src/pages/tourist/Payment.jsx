import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Payment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [destination, setDestination] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    saveCard: false
  });
  
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    // Retrieve data from session storage
    const storedDestination = sessionStorage.getItem('selectedDestination');
    const storedTripDetails = sessionStorage.getItem('tripDetails');
    const storedVehicle = sessionStorage.getItem('selectedVehicle');

    if (!storedDestination || !storedTripDetails || !storedVehicle) {
      setError('Booking information is incomplete. Please restart the booking process.');
      setLoading(false);
      return;
    }

    try {
      setDestination(JSON.parse(storedDestination));
      setTripDetails(JSON.parse(storedTripDetails));
      setVehicle(JSON.parse(storedVehicle));
      setLoading(false);
    } catch  {
      setError('Failed to load booking information. Please try again.');
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (paymentMethod === 'card') {
      if (!formData.cardNumber.trim()) {
        errors.cardNumber = 'Card number is required';
      } else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
        errors.cardNumber = 'Invalid card number';
      }
      
      if (!formData.cardholderName.trim()) {
        errors.cardholderName = 'Cardholder name is required';
      }
      
      if (!formData.expiryDate.trim()) {
        errors.expiryDate = 'Expiry date is required';
      } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
        errors.expiryDate = 'Invalid format (MM/YY)';
      }
      
      if (!formData.cvv.trim()) {
        errors.cvv = 'CVV is required';
      } else if (!/^\d{3,4}$/.test(formData.cvv)) {
        errors.cvv = 'Invalid CVV';
      }
    }
    
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setProcessingPayment(true);
    
    // Simulate payment processing
    setTimeout(() => {
      // In a real app, we would make an API call to process payment and create booking
      
      // Clear session storage data
      sessionStorage.removeItem('selectedDestination');
      sessionStorage.removeItem('tripDetails');
      sessionStorage.removeItem('selectedVehicle');
      
      // Generate a booking confirmation number
      const bookingNumber = 'BK' + Math.floor(100000 + Math.random() * 900000);
      
      // Navigate to confirmation page
      navigate('/booking-confirmation', { 
        state: { 
          bookingNumber,
          destination,
          tripDetails,
          vehicle
        } 
      });
    }, 2000);
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
            onClick={() => navigate('/destinations')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Browse Destinations
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = Math.round(vehicle.pricePerDay * 1.05);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Complete Your Booking</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex space-x-4">
                  <div 
                    onClick={() => setPaymentMethod('card')} 
                    className={`flex-1 p-4 border rounded-lg cursor-pointer ${
                      paymentMethod === 'card' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        id="card"
                        name="paymentMethod"
                        type="radio"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="card" className="ml-3 block text-sm font-medium text-gray-700">
                        Credit / Debit Card
                      </label>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <svg className="h-6 w-8" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="24" rx="4" fill="#1434CB" />
                        <path d="M16.4701 15.9H13.5601L15.3301 8.1H18.2401L16.4701 15.9Z" fill="white" />
                        <path d="M25.5501 8.3C24.9301 8.1 24.0301 7.9 22.9701 7.9C20.2601 7.9 18.3301 9.3 18.3101 11.3C18.2901 12.8 19.7101 13.6 20.7501 14.1C21.8101 14.6 22.1501 14.9 22.1501 15.3C22.1401 15.9 21.3801 16.2 20.6701 16.2C19.6501 16.2 19.1001 16.1 18.2401 15.7L17.9001 15.5L17.5301 18C18.2701 18.3 19.6301 18.5 21.0301 18.5C23.9001 18.5 25.7901 17.1 25.8101 15C25.8301 13.8 25.0601 12.9 23.4701 12.2C22.5101 11.7 21.9501 11.4 21.9501 11C21.9601 10.6 22.3901 10.2 23.2901 10.2C24.0401 10.2 24.5901 10.3 25.0001 10.5L25.2501 10.6L25.5501 8.3Z" fill="white" />
                        <path d="M29.6601 8.1H27.4801C26.8901 8.1 26.4401 8.3 26.1801 8.9L22.7401 15.9H25.6001C25.6001 15.9 26.0001 14.8 26.1001 14.6C26.3901 14.6 29.0001 14.6 29.3601 14.6C29.4401 14.9 29.6601 15.9 29.6601 15.9H32.2301L29.6601 8.1ZM26.9401 12.6C27.1101 12.1 27.8201 10.3 27.8201 10.3C27.8101 10.3 28.0001 9.8 28.1101 9.5L28.2701 10.2C28.2701 10.2 28.6901 12.2 28.7701 12.6H26.9401Z" fill="white" />
                        <path d="M11.6501 8.1L8.9001 13.6L8.6001 12.4C8.0001 10.8 6.5501 9.3 4.9001 8.5L7.4001 15.9H10.2901L14.5501 8.1H11.6501Z" fill="white" />
                        <path d="M6.6401 8.1H2.0001L2.0001 8.3C5.4001 9.2 7.6001 11.5 8.6001 12.4L7.6001 8.9C7.4001 8.3 7.0001 8.1 6.6401 8.1Z" fill="#F9A51A" />
                      </svg>
                      <svg className="h-6 w-8" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="24" rx="4" fill="#252525" />
                        <path d="M14.5 14.9974C16.6906 14.9974 18.4656 13.2224 18.4656 11.0318C18.4656 8.8412 16.6906 7.06621 14.5 7.06621C12.3094 7.06621 10.5344 8.8412 10.5344 11.0318C10.5344 13.2224 12.3094 14.9974 14.5 14.9974Z" fill="#EB001B" />
                        <path d="M25.5 14.9974C27.6906 14.9974 29.4656 13.2224 29.4656 11.0318C29.4656 8.8412 27.6906 7.06621 25.5 7.06621C23.3094 7.06621 21.5344 8.8412 21.5344 11.0318C21.5344 13.2224 23.3094 14.9974 25.5 14.9974Z" fill="#F79E1B" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M20 8.51211C21.3967 9.49961 22.3155 11.0555 22.3155 12.8243C22.3155 14.5924 21.3967 16.1493 20 17.1368C18.6033 16.1493 17.6845 14.5924 17.6845 12.8243C17.6845 11.0555 18.6033 9.49961 20 8.51211Z" fill="#FF5F00" />
                      </svg>
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => setPaymentMethod('paypal')} 
                    className={`flex-1 p-4 border rounded-lg cursor-pointer ${
                      paymentMethod === 'paypal' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        id="paypal"
                        name="paymentMethod"
                        type="radio"
                        checked={paymentMethod === 'paypal'}
                        onChange={() => setPaymentMethod('paypal')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="paypal" className="ml-3 block text-sm font-medium text-gray-700">
                        PayPal
                      </label>
                    </div>
                    <div className="mt-3 flex justify-center">
                      <svg className="h-6 w-16" viewBox="0 0 80 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                         <path d="M25.4202 2.07143H20.8059C20.4642 2.07143 20.1785 2.32589 20.1225 2.66071L18.0499 16.7054C18.0086 16.95 18.1988 17.1696 18.4476 17.1696H20.8899C21.1386 17.1696 21.345 16.9946 21.3863 16.75L21.9173 13.4955C21.9732 13.1607 22.2589 12.9062 22.6006 12.9062H24.221C27.7547 12.9062 29.8273 11.1741 30.3302 7.83929C30.5544 6.35714 30.2406 5.17857 29.4646 4.36607C28.6325 3.49107 27.241 3.07143 25.4859 3.07143H25.4202ZM25.9888 8.08036C25.7031 9.78571 24.4074 9.78571 23.1658 9.78571H22.467L22.9699 6.75893C22.9978 6.58929 23.1435 6.45536 23.315 6.45536H23.6357C24.4353 6.45536 25.1833 6.45536 25.581 6.91071C25.8329 7.16518 25.9449 7.54911 25.9888 8.08036ZM40.9035 7.98214H38.6858C38.5144 7.98214 38.3686 8.11607 38.3408 8.28571L38.2567 8.83036L38.1167 8.63393C37.6139 7.9375 36.5212 7.72768 35.4285 7.72768C33.0244 7.72768 31.039 9.51786 30.6554 12C30.4592 13.2321 30.7169 14.3839 31.3597 15.2054C31.9466 15.9554 32.7786 16.275 33.774 16.275C35.6836 16.275 36.742 15.1518 36.742 15.1518L36.6579 15.6964C36.6165 15.9411 36.8068 16.1607 37.0556 16.1607H38.9917C39.3334 16.1607 39.6191 15.9062 39.6751 15.5714L40.9708 8.23661C41.0121 7.99196 40.8219 7.77232 40.9035 7.98214ZM37.4074 12.0446C37.201 13.3304 36.1924 14.1875 34.9107 14.1875C34.1895 14.1875 33.6167 13.9732 33.2749 13.5446C32.9332 13.1161 32.8211 12.5 32.9332 11.775C33.1114 10.5 34.144 9.62054 35.4117 9.62054C36.1329 9.62054 36.6914 9.84018 37.0332 10.2688C37.386 10.7134 37.4982 11.3295 37.4074 12.0446ZM52.7351 7.98214H50.5064C50.3069 7.98214 50.1074 8.08036 49.9919 8.25L46.5917 13.1429L45.1171 8.44643C45.0172 8.17857 44.7595 7.98214 44.4737 7.98214H42.2921C42.0154 7.98214 41.8159 8.23661 41.8159 8.51786C41.8159 8.76786 44.5038 14.9821 47.0217 16.1607C47.2212 16.1607 45.4382 19.001 44.5498 20.0714C44.3503 20.3214 44.5058 20.6696 44.8196 20.6696H47.0484C47.2479 20.6696 47.4435 20.5804 47.5628 20.4107L54.5022 8.58036C54.686 8.32589 54.5298 7.98214 54.216 7.98214H52.7351Z" fill="#179BD7"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {paymentMethod === 'card' && (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                        Card number
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        {formErrors.cardNumber && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.cardNumber}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700">
                        Name on card
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="cardholderName"
                          name="cardholderName"
                          placeholder="John Smith"
                          value={formData.cardholderName}
                          onChange={handleInputChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        {formErrors.cardholderName && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.cardholderName}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                        Expiry date (MM/YY)
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="expiryDate"
                          name="expiryDate"
                          placeholder="MM/YY"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        {formErrors.expiryDate && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.expiryDate}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                        CVV
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="cvv"
                          name="cvv"
                          placeholder="123"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        {formErrors.cvv && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.cvv}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <div className="flex items-center">
                        <input
                          id="saveCard"
                          name="saveCard"
                          type="checkbox"
                          checked={formData.saveCard}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="saveCard" className="ml-2 block text-sm text-gray-700">
                          Save this card for future bookings
                        </label>
                      </div>
                    </div>
                  </div>
                </form>
              )}
              
              {paymentMethod === 'paypal' && (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">
                    Click the button below to complete payment with PayPal.
                  </p>
                  <div className="inline-block bg-[#FFC439] text-[#253B80] font-bold py-2 px-4 rounded">
                    <span>Pay with</span>
                    <span className="text-[#179BD7]">Pay</span>
                    <span className="text-[#253B80]">Pal</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-4">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Booking Summary</h2>
            </div>
            
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-20 w-20 bg-gray-200 rounded-md overflow-hidden">
                  <img 
                    src={vehicle.imageUrl} 
                    alt={`${vehicle.make} ${vehicle.model}`} 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-base font-medium text-gray-900">{vehicle.make} {vehicle.model}</h3>
                  <p className="mt-1 text-sm text-gray-500">{vehicle.type} • {vehicle.capacity} passengers</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Destination</span>
                  <span className="text-gray-900 font-medium">{destination.name}</span>
                </div>
                
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-900 font-medium">{new Date(tripDetails.date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Time</span>
                  <span className="text-gray-900 font-medium">{tripDetails.time}</span>
                </div>
                
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Travelers</span>
                  <span className="text-gray-900 font-medium">{tripDetails.numTravelers}</span>
                </div>
                
                {tripDetails.notes && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Special requests</span>
                    <span className="text-gray-900 font-medium">Yes</span>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Vehicle rental</span>
                  <span className="text-gray-900">LKR {vehicle.pricePerDay.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Driver fee</span>
                  <span className="text-gray-900">Included</span>
                </div>
                
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Service fee</span>
                  <span className="text-gray-900">LKR {Math.round(vehicle.pricePerDay * 0.05).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">Total</span>
                  <span className="text-base font-medium text-gray-900">LKR {totalAmount.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Including all taxes and fees</p>
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={processingPayment}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                    processingPayment ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {processingPayment ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Payment...
                    </>
                  ) : (
                    `Complete Booking - LKR ${totalAmount.toLocaleString()}`
                  )}
                </button>
              </div>
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  Return to vehicle selection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;