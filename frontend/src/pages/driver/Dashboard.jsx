import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function DriverDashboard() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 3250,
    total: 22500
  });

  useEffect(() => {
    // In a real app, we would fetch data from an API
    // For now, we'll use mock data
    setTimeout(() => {
      const mockBookings = [
        {
          id: 'BK654321',
          status: 'upcoming',
          date: '2023-07-18',
          time: '10:00',
          tourist: {
            name: 'Jane Smith',
            phone: '+1 456-789-0123',
            imageUrl: 'https://via.placeholder.com/150?text=Jane'
          },
          destination: {
            name: 'Sigiriya Rock Fortress',
            location: 'Dambulla, Central Province'
          },
          vehicle: {
            make: 'Toyota',
            model: 'Corolla',
            type: 'Car'
          },
          totalAmount: 5250
        },
        {
          id: 'BK987654',
          status: 'completed',
          date: '2023-07-10',
          time: '09:30',
          tourist: {
            name: 'John Doe',
            phone: '+1 234-567-8901',
            imageUrl: 'https://via.placeholder.com/150?text=John'
          },
          destination: {
            name: 'Galle Fort',
            location: 'Galle, Southern Province'
          },
          vehicle: {
            make: 'Toyota',
            model: 'Corolla',
            type: 'Car'
          },
          totalAmount: 7500,
          rating: 5,
          review: 'Great service, very punctual and friendly driver!'
        },
        {
          id: 'BK246810',
          status: 'cancelled',
          date: '2023-07-05',
          time: '14:00',
          tourist: {
            name: 'Alice Johnson',
            phone: '+1 678-901-2345',
            imageUrl: 'https://via.placeholder.com/150?text=Alice'
          },
          destination: {
            name: 'Nine Arch Bridge',
            location: 'Ella, Uva Province'
          },
          vehicle: {
            make: 'Toyota',
            model: 'Corolla',
            type: 'Car'
          },
          totalAmount: 6750,
          cancellationReason: 'Tourist cancelled due to weather conditions'
        }
      ];

      const mockVehicles = [
        {
          id: 1,
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          type: 'Car',
          licensePlate: 'ABC-1234',
          status: 'active',
          imageUrl: 'https://via.placeholder.com/150?text=Toyota+Corolla'
        },
        {
          id: 2,
          make: 'Honda',
          model: 'Civic',
          year: 2019,
          type: 'Car',
          licensePlate: 'DEF-5678',
          status: 'maintenance',
          imageUrl: 'https://via.placeholder.com/150?text=Honda+Civic'
        }
      ];

      setBookings(mockBookings);
      setVehicles(mockVehicles);
      setLoading(false);
      setEarnings({
        today: 0,
        thisWeek: 0,
        thisMonth: 3250,
        total: 22500
      });
      
      setLoading(false);

    }, 1000);
  }, []);

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'upcoming') {
      return booking.status === 'upcoming';
    } else if (activeTab === 'completed') {
      return booking.status === 'completed';
    } else if (activeTab === 'cancelled') {
      return booking.status === 'cancelled';
    }
    return true;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your bookings and vehicles
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            to="/driver/vehicle-registration"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Vehicle
          </Link>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today's Earnings</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">LKR {earnings.today.toLocaleString()}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">This Week</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">LKR {earnings.thisWeek.toLocaleString()}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">LKR {earnings.thisMonth.toLocaleString()}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">LKR {earnings.total.toLocaleString()}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles Section */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Your Vehicles</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{vehicle.make} {vehicle.model}</h3>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(vehicle.status)}`}>
                    {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <p>{vehicle.type} • {vehicle.year}</p>
                  <p>License Plate: {vehicle.licensePlate}</p>
                </div>
                <div className="mt-4">
                  <img 
                    src={vehicle.imageUrl} 
                    alt={`${vehicle.make} ${vehicle.model}`} 
                    className="h-40 w-full object-cover rounded-md"
                  />
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit
                  </button>
                  {vehicle.status === 'active' ? (
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                    >
                      <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      Set as Maintenance
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                    >
                      <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Set as Active
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bookings Section */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Trip Bookings</h2>
        <div className="mt-4">
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
                  className={`${
                    activeTab === 'upcoming'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`${
                    activeTab === 'completed'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setActiveTab('cancelled')}
                  className={`${
                    activeTab === 'cancelled'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
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
                        <h3 className="text-lg font-medium text-gray-900">
                          Booking #{booking.id}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          {new Date(booking.date).toLocaleDateString()} • {booking.time}
                        </p>
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
                          <h4 className="text-sm font-medium text-gray-500">Tourist</h4>
                          <div className="mt-1 flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden">
                              <img 
                                src={booking.tourist.imageUrl} 
                                alt={booking.tourist.name} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{booking.tourist.name}</p>
                              <p className="text-sm text-gray-500">{booking.tourist.phone}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Destination</h4>
                          <p className="mt-1 text-sm font-medium text-gray-900">{booking.destination.name}</p>
                          <p className="text-sm text-gray-500">{booking.destination.location}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Payment</h4>
                          <p className="mt-1 text-sm font-medium text-gray-900">LKR {booking.totalAmount.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">Paid in full</p>
                        </div>
                      </div>
                      
                      {booking.rating && (
                        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-yellow-800">
                                Rating: {booking.rating}/5
                              </p>
                              {booking.review && (
                                <p className="mt-1 text-sm text-yellow-700">
                                  "{booking.review}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {booking.cancellationReason && (
                        <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-red-800">
                                Cancellation reason: {booking.cancellationReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 px-4 py-4 sm:px-6 bg-gray-50 flex flex-wrap gap-2">
                      {booking.status === 'upcoming' && (
                        <>
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                          >
                            <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                          >
                            <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Contact Tourist
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                          >
                            <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel Trip
                          </button>
                        </>
                      )}
                      
                      {booking.status === 'completed' && (
                        <>
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                          >
                            <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />

                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </button>
                        </>
                      )}
                      
                      {booking.status === 'cancelled' && (
                        <>
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                          >
                            <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverDashboard;