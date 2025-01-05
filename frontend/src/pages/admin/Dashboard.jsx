import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import AdminNavbar from '../../components/admin/AdminNavbar';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('drivers');
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalDrivers: 0,
    pendingDrivers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalDestinations: 0
  });
  const [destinations, setDestinations] = useState([]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      try {
        // Fetch dashboard statistics
        console.log('Fetching dashboard stats...');
        const statsResponse = await adminService.getDashboardStats();

        if (statsResponse.data && statsResponse.data.success) {
          console.log('Dashboard stats received:', statsResponse.data);
          const dashboardData = statsResponse.data.data;

          setStats({
            totalDrivers: dashboardData.users?.DriverCount || 0,
            pendingDrivers: dashboardData.pendingDrivers?.length || 0,
            totalBookings: dashboardData.bookingStats?.TotalBookings || 0,
            totalRevenue: dashboardData.bookingStats?.TotalRevenue || 0,
            totalDestinations: dashboardData.topDestinations?.length || 0
          });

          // Set recent bookings
          if (dashboardData.recentBookings) {
            const formattedBookings = dashboardData.recentBookings.map(booking => ({
              id: booking.BookingID,
              touristName: booking.TouristName,
              driverName: booking.DriverName,
              destination: booking.DestinationName,
              date: booking.TripDate,
              time: booking.TripTime,
              status: booking.Status.toLowerCase(),
              amount: booking.TotalAmount
            }));
            setBookings(formattedBookings);
          }

          // Set top destinations
          if (dashboardData.topDestinations) {
            setDestinations(dashboardData.topDestinations);
          }
        } else {
          console.warn('Dashboard stats response not successful:', statsResponse);
          throw new Error('Failed to fetch dashboard statistics');
        }
      } catch (statsError) {
        console.error('Error fetching dashboard stats:', statsError);
        // Continue with fetching drivers even if stats fail
      }

      try {
        // Fetch drivers
        console.log('Fetching drivers...');
        const driversResponse = await adminService.getDrivers();

        if (driversResponse.data && driversResponse.data.success) {
          console.log('Drivers data received:', driversResponse.data);
          const driversData = driversResponse.data.data;

          const formattedDrivers = driversData.map(driver => ({
            id: driver.DriverID,
            name: driver.Name,
            email: driver.Email,
            phone: driver.PhoneNumber,
            licenseNumber: driver.LicenseNumber,
            status: driver.Status.toLowerCase(),
            registrationDate: new Date(driver.CreatedAt).toISOString().split('T')[0],
            vehicles: driver.VehicleCount || 0,
            trips: driver.TotalTrips || 0,
            rating: driver.Rating,
            imageUrl: driver.ProfilePicture || 'https://via.placeholder.com/150?text=Driver'
          }));

          setDrivers(formattedDrivers);
        } else {
          console.warn('Drivers response not successful:', driversResponse);
          throw new Error('Failed to fetch drivers data');
        }
      } catch (driversError) {
        console.error('Error fetching drivers:', driversError);
        // Continue even if drivers fetch fails
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(`Failed to load dashboard data: ${err.message || 'Unknown error'}`);
      setLoading(false);
      toast.error('Failed to load dashboard data. Please try refreshing the page or contact support.');
    }
  };

  // Handle driver status update
  const handleDriverStatusUpdate = async (driverId, newStatus) => {
    try {
      console.log(`Updating driver status: ID=${driverId}, NewStatus=${newStatus}`);
      const response = await adminService.updateDriverStatus(driverId, newStatus);

      if (response.data && response.data.success) {
        // Update the driver in the local state
        setDrivers(prevDrivers =>
          prevDrivers.map(driver =>
            driver.id === driverId
              ? { ...driver, status: newStatus.toLowerCase() }
              : driver
          )
        );

        toast.success(`Driver status updated to ${newStatus}`);

        // Refresh dashboard data to update counts
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error updating driver status:', err);
      toast.error(`Failed to update driver status: ${err.message || 'Unknown error'}`);
    }
  };

  // Handle driver approval (specific function for the Approve button)
  const handleApproveDriver = async (driverId, e) => {
    try {
      console.log(`Approving driver with ID: ${driverId}`);
      // Prevent event bubbling to parent button
      if (e) e.stopPropagation();

      // Call the driver status update with 'Approved' status for TripBookingSystem schema
      await handleDriverStatusUpdate(driverId, 'Approved');
    } catch (err) {
      console.error('Error approving driver:', err);
      toast.error(`Failed to approve driver: ${err.message || 'Unknown error'}`);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage drivers, bookings, and system settings
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <Link
            to="/admin/destinations"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-primary-600 hover:bg-primary-700"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage Destinations
          </Link>
          <Link
            to="/admin/drivers"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-primary-600 hover:bg-primary-700"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Manage Drivers
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Drivers</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalDrivers}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Approvals</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.pendingDrivers}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalBookings}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">LKR {stats.totalRevenue.toLocaleString()}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
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
            <option value="drivers">Drivers</option>
            <option value="bookings">Bookings</option>
            <option value="destinations">Destinations</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('drivers')}
                className={`${
                  activeTab === 'drivers'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Drivers
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`${
                  activeTab === 'bookings'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Bookings
              </button>
              <button
                onClick={() => setActiveTab('destinations')}
                className={`${
                  activeTab === 'destinations'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Destinations
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* Drivers Tab */}
              {activeTab === 'drivers' && (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Driver
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          License
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Vehicles
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Trips
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Rating
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {drivers.map((driver) => (
                        <tr key={driver.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 overflow-hidden">
                                <img
                                  src={driver.imageUrl}
                                  alt={driver.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">{driver.name}</div>
                                <div className="text-gray-500">{driver.email}</div>
                                <div className="text-gray-500">{driver.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(driver.status)}`}>
                              {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {driver.licenseNumber}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {driver.vehicles}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {driver.trips}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {driver.rating ? (
                              <div className="flex items-center">
                                <svg className="h-4 w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="ml-1">{driver.rating}</span>
                              </div>
                            ) : (
                              <span>N/A</span>
                            )}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex space-x-2 justify-end">
                              <Link
                                to={`/admin/drivers/${driver.id}`}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200"
                              >
                                View
                              </Link>
                              {driver.status === 'pending' && (
                                <button
                                  type="button"
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                                  onClick={(e) => handleApproveDriver(driver.id, e)}
                                >
                                  Approve
                                </button>
                              )}
                              {(driver.status === 'active' || driver.status === 'approved') && (
                                <button
                                  type="button"
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDriverStatusUpdate(driver.id, 'Blocked')}
                                >
                                  Suspend
                                </button>
                              )}
                              {(driver.status === 'suspended' || driver.status === 'blocked' || driver.status === 'rejected') && (
                                <button
                                  type="button"
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                                  onClick={() => handleDriverStatusUpdate(driver.id, 'Approved')}
                                >
                                  Reactivate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Booking ID
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Tourist
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Driver
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Destination
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Date & Time
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Amount
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {booking.id}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {booking.touristName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {booking.driverName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {booking.destination}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(booking.date).toLocaleDateString()} • {booking.time}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(booking.status)}`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            LKR {booking.amount.toLocaleString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <Link
                              to={`/admin/bookings/${booking.id}`}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Destinations Tab */}
              {activeTab === 'destinations' && (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <div className="flex justify-between items-center p-4 bg-white">
                    <h3 className="text-lg font-medium text-gray-900">Destinations</h3>
                    <Link
                      to="/admin/destinations"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Manage All Destinations
                    </Link>
                  </div>
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-6">
                          Image
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                          Name
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                          Location
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
                          Status
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {destinations.map((destination) => (
                        <tr key={destination.DestinationID}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <img
                              src={destination.ImageURL}
                              alt={destination.Name}
                              className="h-16 w-24 object-cover rounded"
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">
                            {destination.Name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {destination.Location}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              destination.Status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {destination.Status}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <Link
                              to={`/admin/destinations?edit=${destination.DestinationID}`}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

export default AdminDashboard;