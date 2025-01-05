import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function TouristDashboard() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const mockBookings = [
        {
          id: 'BK123456',
          status: 'upcoming',
          date: '2023-07-15',
          time: '09:00',
          destination: {
            name: 'Sigiriya Rock Fortress',
            location: 'Dambulla, Central Province'
          },
          vehicle: {
            make: 'Toyota',
            model: 'Corolla',
            type: 'Car',
            imageUrl: 'https://via.placeholder.com/150?text=Toyota+Corolla'
          },
          driver: {
            name: 'Rahul Perera',
            phone: '+94 71 234 5678',
            rating: 4.8
          },
          totalAmount: 5250
        },
        {
          id: 'BK789012',
          status: 'completed',
          date: '2023-06-20',
          time: '10:30',
          destination: {
            name: 'Galle Fort',
            location: 'Galle, Southern Province'
          },
          vehicle: {
            make: 'Honda',
            model: 'CR-V',
            type: 'SUV',
            imageUrl: 'https://via.placeholder.com/150?text=Honda+CRV'
          },
          driver: {
            name: 'Nihal Jayawardene',
            phone: '+94 77 345 6789',
            rating: 4.9
          },
          totalAmount: 7875
        },
        {
          id: 'BK345678',
          status: 'cancelled',
          date: '2023-06-05',
          time: '08:00',
          destination: {
            name: 'Temple of the Sacred Tooth Relic',
            location: 'Kandy, Central Province'
          },
          vehicle: {
            make: 'Nissan',
            model: 'Urvan',
            type: 'Van',
            imageUrl: 'https://via.placeholder.com/150?text=Nissan+Van'
          },
          driver: {
            name: 'Kumar Silva',
            phone: '+94 76 456 7890',
            rating: 4.7
          },
          totalAmount: 9450,
          cancellationReason: 'Weather conditions'
        }
      ];
      setBookings(mockBookings);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'upcoming') return booking.status === 'upcoming';
    if (activeTab === 'completed') return booking.status === 'completed';
    if (activeTab === 'cancelled') return booking.status === 'cancelled';
    return true;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your trips and bookings</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Link
            to="/destinations"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Plan a New Trip
          </Link>
          <Link
            to="/multi-destination-trip"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Multi-Destination Trip
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">Select a tab</label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full focus:ring-primary-500 focus:border-primary-500 border-gray-300 rounded-md"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`${activeTab === 'upcoming' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`${activeTab === 'completed' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Completed
              </button>
              <button
                onClick={() => setActiveTab('cancelled')}
                className={`${activeTab === 'cancelled' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Cancelled
              </button>
            </nav>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="space-y-6">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="bg-white shadow overflow-hidden rounded-lg">
                  <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row md:justify-between md:items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Booking #{booking.id}</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">{new Date(booking.date).toLocaleDateString()} • {booking.time}</p>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Destination</h4>
                        <p className="mt-1 text-sm font-medium text-gray-900">{booking.destination.name}</p>
                        <p className="text-sm text-gray-500">{booking.destination.location}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Vehicle & Driver</h4>
                        <div className="mt-1 flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md overflow-hidden">
                            <img
                              src={booking.vehicle.imageUrl}
                              alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{booking.vehicle.make} {booking.vehicle.model}</p>
                            <p className="text-sm text-gray-500">Driver: {booking.driver.name}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Payment</h4>
                        <p className="mt-1 text-sm font-medium text-gray-900">LKR {booking.totalAmount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Paid in full</p>
                      </div>
                    </div>

                    {booking.cancellationReason && (
                      <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-800">Cancellation reason: {booking.cancellationReason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-200 px-4 py-4 sm:px-6 bg-gray-50 flex flex-wrap gap-2">
                    {booking.status === 'upcoming' && (
                      <>
                        <Link
                          to={`/trip/${booking.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                        >
                          <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </Link>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                          <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Modify
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                        >
                          <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                        </button>
                      </>
                    )}

                    {booking.status === 'completed' && (
                      <>
                        <Link
                          to={`/trip/${booking.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                        >
                          <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </Link>
                        <Link
                          to={`/review-trip/${booking.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                        >
                          <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          Rate & Review
                        </Link>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                        >
                          <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Book Again
                        </button>
                      </>
                    )}

                    {booking.status === 'cancelled' && (
                      <>
                        <Link
                          to={`/trip/${booking.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                        >
                          <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </Link>
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                        >
                          <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Book Again
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeTab} bookings</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'upcoming' ? 'You have no upcoming trips.' : activeTab === 'completed' ? 'You have no completed trips yet.' : 'You have no cancelled trips.'}
              </p>
              {activeTab === 'upcoming' && (
                <div className="mt-6">
                  <Link
                    to="/destinations"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-primary-600 hover:bg-primary-700"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Plan a Trip
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TouristDashboard;