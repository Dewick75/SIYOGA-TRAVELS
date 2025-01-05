import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import AdminNavbar from '../../components/admin/AdminNavbar';

function DriverManagement() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch drivers data
  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter) filters.status = statusFilter;

      console.log('Fetching drivers with filters:', filters);
      const response = await adminService.getDrivers(filters);

      if (response.data && response.data.success) {
        console.log('Drivers data received:', response.data);
        setDrivers(response.data.data);
      } else {
        console.warn('Drivers response not successful:', response);
        throw new Error('Failed to fetch drivers data');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError(`Failed to load drivers: ${err.message || 'Unknown error'}`);
      setLoading(false);
      toast.error('Failed to load drivers data. Please check console for details.');
    }
  };

  // Fetch driver details
  const fetchDriverDetails = async (id) => {
    try {
      const response = await adminService.getDriver(id);

      if (response.data && response.data.success) {
        setSelectedDriver(response.data.data);
        setShowDetailsModal(true);
      } else {
        throw new Error('Failed to fetch driver details');
      }
    } catch (err) {
      console.error('Error fetching driver details:', err);
      toast.error('Failed to load driver details');
    }
  };

  // Handle driver status update
  const handleStatusUpdate = async (driverId, newStatus) => {
    try {
      console.log(`Attempting to update driver ${driverId} status to ${newStatus}`);

      // Show loading toast
      const toastId = toast.loading(`Updating driver status to ${newStatus}...`);

      // Manual update in UI immediately for better user experience
      // This will be reverted if the API call fails
      const originalDrivers = [...drivers];
      setDrivers(prevDrivers =>
        prevDrivers.map(driver =>
          driver.DriverID === driverId
            ? { ...driver, Status: newStatus }
            : driver
        )
      );

      if (selectedDriver && selectedDriver.DriverID === driverId) {
        setSelectedDriver({ ...selectedDriver, Status: newStatus });
      }

      try {
        const response = await adminService.updateDriverStatus(driverId, newStatus);

        if (response.data && response.data.success) {
          // Update toast to success
          toast.update(toastId, {
            render: `Driver status updated to ${newStatus}`,
            type: "success",
            isLoading: false,
            autoClose: 3000
          });

          console.log('Driver status update successful:', response.data);

          // Refresh the driver list to ensure we have the latest data
          fetchDrivers();
        } else {
          // Revert the UI changes
          setDrivers(originalDrivers);
          if (selectedDriver && selectedDriver.DriverID === driverId) {
            const originalDriver = originalDrivers.find(d => d.DriverID === driverId);
            if (originalDriver) {
              setSelectedDriver({ ...selectedDriver, Status: originalDriver.Status });
            }
          }

          // Update toast to error
          toast.update(toastId, {
            render: `Failed to update driver status: ${response.data?.message || 'Unknown error'}`,
            type: "error",
            isLoading: false,
            autoClose: 5000
          });
          console.error('Driver status update failed:', response.data);
        }
      } catch (apiError) {
        console.error('API Error updating driver status:', apiError);

        // For network errors, we'll try a direct database update as fallback
        if (apiError.message === 'Network Error') {
          // Keep the optimistic UI update and show a warning
          toast.update(toastId, {
            render: `Network issue detected. Status may be updated but not reflected immediately. Please refresh.`,
            type: "warning",
            isLoading: false,
            autoClose: 8000
          });

          // Add a refresh button to the UI
          setTimeout(() => {
            toast.info(
              <div>
                <p>Please refresh the page to see the latest status</p>
                <button
                  onClick={fetchDrivers}
                  className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                >
                  Refresh Now
                </button>
              </div>,
              { autoClose: false }
            );
          }, 1000);
        } else {
          // Revert the UI changes for other errors
          setDrivers(originalDrivers);
          if (selectedDriver && selectedDriver.DriverID === driverId) {
            const originalDriver = originalDrivers.find(d => d.DriverID === driverId);
            if (originalDriver) {
              setSelectedDriver({ ...selectedDriver, Status: originalDriver.Status });
            }
          }

          // Get detailed error message
          const errorMessage = apiError.response?.data?.message || apiError.message || 'Unknown error occurred';

          // Update toast to error
          toast.update(toastId, {
            render: `Failed to update driver status: ${errorMessage}`,
            type: "error",
            isLoading: false,
            autoClose: 5000
          });

          // Log detailed error information
          if (apiError.response) {
            console.error('Error response:', apiError.response.data);
            console.error('Status code:', apiError.response.status);
          } else if (apiError.request) {
            console.error('No response received:', apiError.request);
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error in handleStatusUpdate:', err);
      toast.error(`An unexpected error occurred: ${err.message}`);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchDrivers();
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Initial data fetch
  useEffect(() => {
    fetchDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
      case 'blocked':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            View, approve, and manage driver accounts
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={fetchDrivers}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <form onSubmit={handleSearch} className="flex w-full md:w-1/2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, phone or license..."
            className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
        </form>
        <div className="flex items-center space-x-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
            Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Blocked">Blocked</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Error message */}
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

      {/* Drivers Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        {loading ? (
          <div className="flex justify-center items-center h-64 bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : drivers.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white">
            <svg className="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="mt-2 text-gray-500">No drivers found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Driver
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  License
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
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
                <tr key={driver.DriverID}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 overflow-hidden">
                        {driver.ProfilePicture ? (
                          <img
                            src={driver.ProfilePicture}
                            alt={driver.Name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{driver.Name}</div>
                        <div className="text-gray-500">{driver.Email}</div>
                        <div className="text-gray-500">{driver.PhoneNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {driver.LicenseNumber}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(driver.Status)}`}>
                        {driver.Status}
                      </span>
                      {driver.IsEmailVerified ? (
                        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                          Email Verified
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800">
                          Email Not Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {driver.VehicleCount || 0}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {driver.TotalTrips || 0}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {driver.Rating ? (
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="ml-1">{driver.Rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span>N/A</span>
                    )}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex space-x-2 justify-end">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/drivers/${driver.DriverID}`)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200"
                      >
                        View Details
                      </button>
                      {driver.Status === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(driver.DriverID, 'Approved')}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </button>
                      )}
                      {(driver.Status === 'Active' || driver.Status === 'Approved') && (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(driver.DriverID, 'Blocked')}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                        >
                          Block
                        </button>
                      )}
                      {(driver.Status === 'Suspended' || driver.Status === 'Blocked' || driver.Status === 'Rejected') && (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(driver.DriverID, 'Approved')}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
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
        )}
      </div>

      {/* Driver Details Modal */}
      {showDetailsModal && selectedDriver && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Driver Details
                      </h3>
                      <div className="flex space-x-2">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(selectedDriver.Status)}`}>
                          {selectedDriver.Status}
                        </span>
                        {selectedDriver.IsEmailVerified ? (
                          <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                            Email Verified
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800">
                            Email Not Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Personal Information</h4>
                          <div className="mt-2 space-y-2">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Name:</span> {selectedDriver.Name}
                            </p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Email:</span> {selectedDriver.Email}
                            </p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Phone:</span> {selectedDriver.PhoneNumber}
                            </p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">License Number:</span> {selectedDriver.LicenseNumber}
                            </p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Experience:</span> {selectedDriver.ExperienceYears || 'N/A'} years
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Account Information</h4>
                          <div className="mt-2 space-y-2">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Registered:</span> {new Date(selectedDriver.CreatedAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Last Login:</span> {selectedDriver.LastLoginAt ? new Date(selectedDriver.LastLoginAt).toLocaleDateString() : 'Never'}
                            </p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Total Trips:</span> {selectedDriver.TotalTrips || 0}
                            </p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Rating:</span> {selectedDriver.Rating ? `${selectedDriver.Rating.toFixed(1)} (${selectedDriver.ReviewCount} reviews)` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {selectedDriver.Biography && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-500">Biography</h4>
                          <p className="mt-1 text-sm text-gray-900">{selectedDriver.Biography}</p>
                        </div>
                      )}

                      {selectedDriver.Vehicles && selectedDriver.Vehicles.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-500">Vehicles</h4>
                          <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-6">Vehicle</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Type</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Capacity</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {selectedDriver.Vehicles.map((vehicle) => (
                                  <tr key={vehicle.VehicleID}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                      {vehicle.Make} {vehicle.Model} ({vehicle.Year})
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{vehicle.Type}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{vehicle.Capacity} passengers</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        vehicle.Status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {vehicle.Status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {selectedDriver.RecentBookings && selectedDriver.RecentBookings.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-500">Recent Bookings</h4>
                          <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-6">ID</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Tourist</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Date</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Status</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {selectedDriver.RecentBookings.map((booking) => (
                                  <tr key={booking.BookingID}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                      {booking.BookingID}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{booking.TouristName}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {new Date(booking.TripDate).toLocaleDateString()} {booking.TripTime}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(booking.Status)}`}>
                                        {booking.Status}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      LKR {booking.TotalAmount?.toLocaleString() || 0}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedDriver.Status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedDriver.DriverID, 'Approved')}
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Approve Driver
                  </button>
                )}
                {(selectedDriver.Status === 'Active' || selectedDriver.Status === 'Approved') && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedDriver.DriverID, 'Blocked')}
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Block Driver
                  </button>
                )}
                {(selectedDriver.Status === 'Suspended' || selectedDriver.Status === 'Blocked' || selectedDriver.Status === 'Rejected') && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedDriver.DriverID, 'Approved')}
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Reactivate Driver
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default DriverManagement;
