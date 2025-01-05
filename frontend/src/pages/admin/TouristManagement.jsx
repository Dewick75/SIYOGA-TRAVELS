import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import AdminNavbar from '../../components/admin/AdminNavbar';

function TouristManagement() {
  const [tourists, setTourists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTourist, setSelectedTourist] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch tourists data
  const fetchTourists = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      console.log('Fetching tourists with search term:', searchTerm);
      const response = await adminService.getTourists({ search: searchTerm });

      if (response.data && response.data.success) {
        console.log('Tourists data received:', response.data);
        setTourists(response.data.data);
      } else {
        console.warn('Tourists response not successful:', response);
        throw new Error('Failed to fetch tourists data');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching tourists:', err);
      setError(`Failed to load tourists: ${err.message || 'Unknown error'}`);
      setLoading(false);
      toast.error('Failed to load tourists data. Please check console for details.');
    }
  };

  // Fetch tourist details
  const fetchTouristDetails = async (id) => {
    try {
      const response = await adminService.getTourist(id);

      if (response.data && response.data.success) {
        setSelectedTourist(response.data.data);
        setShowDetailsModal(true);
      } else {
        throw new Error('Failed to fetch tourist details');
      }
    } catch (err) {
      console.error('Error fetching tourist details:', err);
      toast.error('Failed to load tourist details');
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchTourists();
  };

  // Initial data fetch
  useEffect(() => {
    fetchTourists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tourist Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage tourist accounts
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={fetchTourists}
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

      {/* Search */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex w-full md:w-1/2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, phone or country..."
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

      {/* Tourists Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        {loading ? (
          <div className="flex justify-center items-center h-64 bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : tourists.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white">
            <svg className="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="mt-2 text-gray-500">No tourists found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Tourist
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Country
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Bookings
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Registered
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Last Login
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tourists.map((tourist) => (
                <tr key={tourist.TouristID}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 overflow-hidden">
                        {tourist.ProfilePicture ? (
                          <img
                            src={tourist.ProfilePicture}
                            alt={tourist.Name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{tourist.Name}</div>
                        <div className="text-gray-500">{tourist.Email}</div>
                        <div className="text-gray-500">{tourist.PhoneNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {tourist.Country || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {tourist.BookingCount || 0}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(tourist.CreatedAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {tourist.LastLoginAt ? new Date(tourist.LastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      type="button"
                      onClick={() => fetchTouristDetails(tourist.TouristID)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Tourist Details Modal */}
      {showDetailsModal && selectedTourist && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Tourist Details
                    </h3>
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Personal Information</h4>
                          <div className="mt-2 space-y-2">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Name:</span> {selectedTourist.Name}
                            </p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Email:</span> {selectedTourist.Email}
                            </p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Phone:</span> {selectedTourist.PhoneNumber}
                            </p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Country:</span> {selectedTourist.Country || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Preferred Language:</span> {selectedTourist.PreferredLanguage || 'English'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Account Information</h4>
                          <div className="mt-2 space-y-2">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Registered:</span> {new Date(selectedTourist.CreatedAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Last Login:</span> {selectedTourist.LastLoginAt ? new Date(selectedTourist.LastLoginAt).toLocaleDateString() : 'Never'}
                            </p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Total Bookings:</span> {selectedTourist.Statistics?.TotalBookings || 0}
                            </p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Completed Trips:</span> {selectedTourist.Statistics?.CompletedBookings || 0}
                            </p>
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Total Spent:</span> LKR {selectedTourist.Statistics?.TotalSpent?.toLocaleString() || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
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

export default TouristManagement;
