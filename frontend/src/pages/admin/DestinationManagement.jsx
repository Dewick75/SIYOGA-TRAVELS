import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import destinationService from '../../services/destinationService';
import AdminNavbar from '../../components/admin/AdminNavbar';

function DestinationManagement() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentDestination, setCurrentDestination] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    activities: '',
    status: 'Active'
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch all destinations
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        const result = await destinationService.getAllDestinations();

        if (result && result.success) {
          setDestinations(result.data);
        } else {
          throw new Error('Failed to fetch destinations');
        }
      } catch (err) {
        console.error('Error fetching destinations:', err);
        setError(err.message || 'Failed to load destinations');
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Open add destination modal
  const openAddModal = () => {
    setFormData({
      name: '',
      location: '',
      description: '',
      activities: '',
      status: 'Active'
    });
    setSelectedImage(null);
    setImagePreview('');
    setSubmitError(null);
    setShowAddModal(true);
  };

  // Open edit destination modal
  const openEditModal = (destination) => {
    setCurrentDestination(destination);
    setFormData({
      name: destination.Name,
      location: destination.Location,
      description: destination.Description || '',
      activities: destination.Activities ? destination.Activities.join(', ') : '',
      status: destination.Status || 'Active'
    });
    setImagePreview(destinationService.formatImageUrl(destination.ImageURL));
    setSelectedImage(null);
    setSubmitError(null);
    setShowEditModal(true);
  };

  // Handle form submission for adding a new destination
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      // First, upload the image if selected
      let imageUrl = null;
      if (selectedImage) {
        const formData = new FormData();
        formData.append('destinationImage', selectedImage);

        const imageResponse = await API.post('/uploads/destination-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (imageResponse.data && imageResponse.data.success) {
          imageUrl = imageResponse.data.data.path;
        } else {
          throw new Error('Failed to upload image');
        }
      }

      // Then create the destination
      const activitiesArray = formData.activities
        ? formData.activities.split(',').map(item => item.trim())
        : [];

      const destinationData = {
        name: formData.name,
        location: formData.location,
        description: formData.description,
        imageUrl: imageUrl,
        activities: activitiesArray,
        status: formData.status
      };

      const response = await API.post('/destinations', destinationData);

      if (response.data && response.data.success) {
        // Add the new destination to the list
        setDestinations(prev => [...prev, response.data.data]);
        setShowAddModal(false);
        setSuccessMessage('Destination added successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Failed to add destination');
      }
    } catch (err) {
      console.error('Error adding destination:', err);
      setSubmitError(err.message || 'Failed to add destination');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submission for editing a destination
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      // First, upload the image if a new one is selected
      let imageUrl = currentDestination.ImageURL;
      if (selectedImage) {
        const formData = new FormData();
        formData.append('destinationImage', selectedImage);

        const imageResponse = await API.post('/uploads/destination-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (imageResponse.data && imageResponse.data.success) {
          imageUrl = imageResponse.data.data.path;
        } else {
          throw new Error('Failed to upload image');
        }
      }

      // Then update the destination
      const activitiesArray = formData.activities
        ? formData.activities.split(',').map(item => item.trim())
        : [];

      const destinationData = {
        name: formData.name,
        location: formData.location,
        description: formData.description,
        imageUrl: imageUrl,
        activities: activitiesArray,
        status: formData.status
      };

      const response = await API.put(`/destinations/${currentDestination.DestinationID}`, destinationData);

      if (response.data && response.data.success) {
        // Update the destination in the list
        setDestinations(prev =>
          prev.map(dest =>
            dest.DestinationID === currentDestination.DestinationID
              ? response.data.data
              : dest
          )
        );
        setShowEditModal(false);
        setSuccessMessage('Destination updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Failed to update destination');
      }
    } catch (err) {
      console.error('Error updating destination:', err);
      setSubmitError(err.message || 'Failed to update destination');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle destination deletion
  const handleDelete = async (destinationId) => {
    if (!window.confirm('Are you sure you want to delete this destination?')) {
      return;
    }

    try {
      const response = await API.delete(`/destinations/${destinationId}`);

      if (response.data && response.data.success) {
        // Remove the destination from the list
        setDestinations(prev => prev.filter(dest => dest.DestinationID !== destinationId));
        setSuccessMessage('Destination deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Failed to delete destination');
      }
    } catch (err) {
      console.error('Error deleting destination:', err);
      setError(err.message || 'Failed to delete destination');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Destination Management</h1>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Add New Destination
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {destinations.map(destination => (
              <tr key={destination.DestinationID}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img
                    src={destinationService.formatImageUrl(destination.ImageURL)}
                    alt={destination.Name}
                    className="h-16 w-24 object-cover rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{destination.Name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{destination.Location}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    destination.Status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {destination.Status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => openEditModal(destination)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(destination.DestinationID)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Destination Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Destination</h2>

            <form onSubmit={handleAddSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Activities (comma-separated)</label>
                  <input
                    type="text"
                    name="activities"
                    value={formData.activities}
                    onChange={handleInputChange}
                    placeholder="e.g. Hiking, Swimming, Sightseeing"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-1 block w-full"
                  />
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="mt-2 h-40 object-cover rounded" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {submitError && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {submitError}
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-md text-white ${
                    submitting ? 'bg-primary-400' : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {submitting ? 'Adding...' : 'Add Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Destination Modal */}
      {showEditModal && currentDestination && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Destination</h2>

            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Activities (comma-separated)</label>
                  <input
                    type="text"
                    name="activities"
                    value={formData.activities}
                    onChange={handleInputChange}
                    placeholder="e.g. Hiking, Swimming, Sightseeing"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-1 block w-full"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-1">Current image:</p>
                      <img src={imagePreview} alt="Preview" className="h-40 object-cover rounded" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {submitError && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {submitError}
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-md text-white ${
                    submitting ? 'bg-primary-400' : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {submitting ? 'Updating...' : 'Update Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default DestinationManagement;
