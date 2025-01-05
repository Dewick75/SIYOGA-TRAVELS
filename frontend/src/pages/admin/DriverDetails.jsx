import { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import { Dialog, Transition } from '@headlessui/react';
import AdminNavbar from '../../components/admin/AdminNavbar';

function DriverDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ src: '', alt: '' });

  // Helper function to format image URL
  const formatImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If it's already a full URL, return it
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // If it's a relative path that starts with /uploads, add the API URL
    if (imagePath.startsWith('/uploads/')) {
      return `${import.meta.env.VITE_API_URL}${imagePath}`;
    }

    // Handle driver document images
    if (imagePath.includes('driver-documents/')) {
      return `${import.meta.env.VITE_API_URL}/uploads/${imagePath}`;
    }

    // Handle profile pictures
    if (imagePath.includes('profile-pictures/')) {
      return `${import.meta.env.VITE_API_URL}/uploads/${imagePath}`;
    }

    // If it's just a filename, assume it's in the uploads directory
    if (!imagePath.includes('/')) {
      return `${import.meta.env.VITE_API_URL}/uploads/${imagePath}`;
    }

    // Otherwise, return as is
    return `${import.meta.env.VITE_API_URL}/uploads/${imagePath}`;
  };

  // Fetch driver details
  const fetchDriverDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminService.getDriver(id);

      if (response.data && response.data.success) {
        console.log('Driver details received:', response.data.data);

        // Format image URLs
        const driverData = response.data.data;

        // Debug image paths
        console.log('Image paths from API:');
        console.log('ProfilePicture:', driverData.ProfilePicture);
        console.log('NICFrontImage:', driverData.NICFrontImage);
        console.log('NICBackImage:', driverData.NICBackImage);
        console.log('LicenseFrontImage:', driverData.LicenseFrontImage);
        console.log('PoliceClearanceImage:', driverData.PoliceClearanceImage);

        if (driverData.ProfilePicture) {
          driverData.ProfilePicture = formatImageUrl(driverData.ProfilePicture);
        }
        if (driverData.NICFrontImage) {
          driverData.NICFrontImage = formatImageUrl(driverData.NICFrontImage);
        }
        if (driverData.NICBackImage) {
          driverData.NICBackImage = formatImageUrl(driverData.NICBackImage);
        }
        if (driverData.LicenseFrontImage) {
          driverData.LicenseFrontImage = formatImageUrl(driverData.LicenseFrontImage);
        }
        if (driverData.PoliceClearanceImage) {
          driverData.PoliceClearanceImage = formatImageUrl(driverData.PoliceClearanceImage);
        }

        // Debug formatted image paths
        console.log('Formatted image paths:');
        console.log('ProfilePicture:', driverData.ProfilePicture);
        console.log('NICFrontImage:', driverData.NICFrontImage);
        console.log('NICBackImage:', driverData.NICBackImage);
        console.log('LicenseFrontImage:', driverData.LicenseFrontImage);
        console.log('PoliceClearanceImage:', driverData.PoliceClearanceImage);

        setDriver(driverData);
      } else {
        throw new Error('Failed to fetch driver details');
      }
    } catch (err) {
      console.error('Error fetching driver details:', err);
      setError(`Failed to load driver details: ${err.message || 'Unknown error'}`);
      toast.error('Failed to load driver details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle driver status update
  const handleStatusUpdate = async (newStatus) => {
    try {
      console.log(`Updating driver status: ID=${id}, NewStatus=${newStatus}`);
      const toastId = toast.loading(`Updating driver status to ${newStatus}...`);

      // Optimistic UI update
      if (driver) {
        setDriver({ ...driver, Status: newStatus });
      }

      const response = await adminService.updateDriverStatus(id, newStatus);

      if (response.data && response.data.success) {
        toast.update(toastId, {
          render: `Driver status updated to ${newStatus}`,
          type: "success",
          isLoading: false,
          autoClose: 3000
        });

        // Refresh driver details to ensure we have the latest data
        fetchDriverDetails();
      } else {
        toast.update(toastId, {
          render: `Failed to update driver status: ${response.data?.message || 'Unknown error'}`,
          type: "error",
          isLoading: false,
          autoClose: 5000
        });
        // Revert UI update
        fetchDriverDetails();
      }
    } catch (err) {
      console.error('Error updating driver status:', err);
      toast.error(`Failed to update driver status: ${err.message || 'Unknown error'}`);
      // Revert UI update
      fetchDriverDetails();
    }
  };

  // Function to open image modal
  const openImageModal = (src, alt) => {
    setSelectedImage({ src, alt });
    setIsImageModalOpen(true);
  };

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

  useEffect(() => {
    if (id) {
      fetchDriverDetails();
    }
  }, [id]);

  return (
    <>
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Details</h1>
            <p className="mt-1 text-sm text-gray-500">
              View complete information about this driver
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/admin/drivers')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Drivers
            </button>
            <button
              onClick={fetchDriverDetails}
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

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Driver details */}
        {!loading && driver && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {/* Header with status and actions */}
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {driver.Name}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Driver ID: {driver.DriverID}
                </p>
              </div>
              <div className="flex items-center space-x-3">
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
            </div>

            {/* Action buttons */}
            <div className="px-4 py-3 bg-gray-50 sm:px-6 flex justify-end space-x-3">
              {(driver.Status === 'Pending') && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Approved')}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Approve Driver
                </button>
              )}
              {(driver.Status === 'Active' || driver.Status === 'Approved') && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Blocked')}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Block Driver
                </button>
              )}
              {(driver.Status === 'Suspended' || driver.Status === 'Blocked' || driver.Status === 'Rejected') && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Approved')}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Reactivate Driver
                </button>
              )}
              {(driver.Status === 'Pending') && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Rejected')}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Reject Driver
                </button>
              )}
            </div>

            {/* Driver information */}
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{driver.Name}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{driver.Email}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{driver.PhoneNumber}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Date of birth</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {driver.JoinDate ? new Date(driver.JoinDate).toLocaleDateString() : 'Not provided'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">NIC number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{driver.NICNumber || 'Not provided'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">License number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{driver.LicenseNumber}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">License expiry date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {driver.LicenseExpiryDate ? new Date(driver.LicenseExpiryDate).toLocaleDateString() : 'Not provided'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Registration date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {driver.CreatedAt ? new Date(driver.CreatedAt).toLocaleDateString() : 'Not available'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Document images */}
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Verification Documents
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Profile picture */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Profile Picture</h4>
                    <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                      {driver.ProfilePicture ? (
                        <img
                          src={driver.ProfilePicture}
                          alt="Profile"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => openImageModal(driver.ProfilePicture, 'Profile Picture')}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300?text=No+Profile+Image';
                          }}
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <p className="mt-2 text-sm">No profile image</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* NIC front image */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">NIC Front</h4>
                    <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                      {driver.NICFrontImage ? (
                        <img
                          src={driver.NICFrontImage}
                          alt="NIC Front"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => openImageModal(driver.NICFrontImage, 'NIC Front')}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300?text=No+NIC+Front+Image';
                          }}
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2 text-sm">No NIC front image</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* NIC back image */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">NIC Back</h4>
                    <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                      {driver.NICBackImage ? (
                        <img
                          src={driver.NICBackImage}
                          alt="NIC Back"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => openImageModal(driver.NICBackImage, 'NIC Back')}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300?text=No+NIC+Back+Image';
                          }}
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2 text-sm">No NIC back image</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* License front image */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Driver's License</h4>
                    <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                      {driver.LicenseFrontImage ? (
                        <img
                          src={driver.LicenseFrontImage}
                          alt="License"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => openImageModal(driver.LicenseFrontImage, 'Driver\'s License')}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300?text=No+License+Image';
                          }}
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2 text-sm">No license image</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Police clearance image */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Police Clearance</h4>
                    <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                      {driver.PoliceClearanceImage ? (
                        <img
                          src={driver.PoliceClearanceImage}
                          alt="Police Clearance"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => openImageModal(driver.PoliceClearanceImage, 'Police Clearance')}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300?text=No+Police+Clearance+Image';
                          }}
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2 text-sm">No police clearance image</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal */}
        <Transition appear show={isImageModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setIsImageModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-75" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        {selectedImage.alt}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500"
                        onClick={() => setIsImageModalOpen(false)}
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-2 flex justify-center">
                      <img
                        src={selectedImage.src}
                        alt={selectedImage.alt}
                        className="max-h-[70vh] max-w-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
                        }}
                      />
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        onClick={() => setIsImageModalOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </>
  );
}

export default DriverDetails;
