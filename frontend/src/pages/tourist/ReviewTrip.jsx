import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ReviewTrip() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    driverRating: 5,
    vehicleRating: 5,
    overallRating: 5,
    comment: '',
  });

  useEffect(() => {
    // In a real app, this would be an API call
    // For now, let's use mock data
    setTimeout(() => {
      if (bookingId === 'BK789012') {
        setBooking({
          id: 'BK789012',
          status: 'completed',
          date: '2023-06-20',
          destination: {
            name: 'Galle Fort',
            location: 'Galle, Southern Province',
          },
          vehicle: {
            make: 'Honda',
            model: 'CR-V',
            type: 'SUV',
            imageUrl: 'https://via.placeholder.com/300x200?text=Honda+CRV'
          },
          driver: {
            name: 'Nihal Jayawardene',
            rating: 4.9,
          }
        });
        setLoading(false);
      } else {
        setError('Booking not found or already reviewed');
        setLoading(false);
      }
    }, 1000);
  }, [bookingId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRatingChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate back to dashboard with success message
      navigate('/tourist/dashboard', { 
        state: { 
          reviewSuccess: true,
          bookingId: booking.id
        } 
      });
    } catch  {
      setError('Failed to submit review. Please try again.');
      setIsSubmitting(false);
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

  // Rating stars component
  const RatingStars = ({ name, value, onChange }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(name, star)}
            className="p-1 focus:outline-none"
          >
            <svg 
              className={`h-8 w-8 ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Rate Your Experience</h1>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h2 className="text-lg font-medium leading-6 text-gray-900">Trip Summary</h2>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center">
            <div className="mb-4 sm:mb-0 sm:mr-6 flex-shrink-0">
              <div className="h-24 w-24 border border-gray-200 rounded-md overflow-hidden">
                <img 
                  src={booking.vehicle.imageUrl} 
                  alt={`${booking.vehicle.make} ${booking.vehicle.model}`} 
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{booking.destination.name}</h3>
              <p className="text-sm text-gray-500">{booking.destination.location}</p>
              <p className="mt-1 text-sm text-gray-500">{new Date(booking.date).toLocaleDateString()}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h2 className="text-lg font-medium leading-6 text-gray-900">Your Review</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Please rate your experience and leave feedback to help improve our service.
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Driver ({booking.driver.name})
                </label>
                <div className="mt-1">
                  <RatingStars 
                    name="driverRating" 
                    value={formData.driverRating} 
                    onChange={handleRatingChange} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vehicle ({booking.vehicle.make} {booking.vehicle.model})
                </label>
                <div className="mt-1">
                  <RatingStars 
                    name="vehicleRating" 
                    value={formData.vehicleRating} 
                    onChange={handleRatingChange} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Overall Experience
                </label>
                <div className="mt-1">
                  <RatingStars 
                    name="overallRating" 
                    value={formData.overallRating} 
                    onChange={handleRatingChange} 
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                  Comments
                </label>
                <div className="mt-1">
                  <textarea
                    id="comment"
                    name="comment"
                    rows="4"
                    value={formData.comment}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Share your experience... What did you like? What could be improved?"
                  ></textarea>
                </div>
              </div>
              
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/tourist/dashboard')}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReviewTrip;