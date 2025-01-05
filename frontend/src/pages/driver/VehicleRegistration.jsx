import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

function VehicleRegistration() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    licensePlate: '',
    capacity: '',
    amenities: '',
    vehicleType: 'car',
    year: new Date().getFullYear(),
    pricePerDay: '',
    vehicleImage: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not logged in or not a driver
    if (!user || user.role !== 'Driver') {
      toast.error('You must be logged in as a driver to register a vehicle');
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, vehicleImage: file });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);

      // Clear error if exists
      if (errors.vehicleImage) {
        setErrors({ ...errors, vehicleImage: '' });
      }
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.make.trim()) {
      newErrors.make = 'Vehicle make is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Vehicle model is required';
    }

    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'License plate is required';
    }

    if (!formData.capacity) {
      newErrors.capacity = 'Capacity is required';
    } else if (isNaN(formData.capacity) || parseInt(formData.capacity) <= 0) {
      newErrors.capacity = 'Capacity must be a positive number';
    }

    if (!formData.year) {
      newErrors.year = 'Year is required';
    } else if (isNaN(formData.year) || parseInt(formData.year) < 1900 || parseInt(formData.year) > new Date().getFullYear() + 1) {
      newErrors.year = 'Please enter a valid year';
    }

    if (!formData.pricePerDay) {
      newErrors.pricePerDay = 'Price per day is required';
    } else if (isNaN(formData.pricePerDay) || parseFloat(formData.pricePerDay) <= 0) {
      newErrors.pricePerDay = 'Price must be a positive number';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      // Create form data for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('type', formData.vehicleType);
      formDataToSend.append('make', formData.make);
      formDataToSend.append('model', formData.model);
      formDataToSend.append('year', formData.year);
      formDataToSend.append('licensePlate', formData.licensePlate);
      formDataToSend.append('capacity', formData.capacity);
      formDataToSend.append('pricePerDay', formData.pricePerDay);

      // Convert amenities to array and stringify
      if (formData.amenities) {
        const amenitiesArray = formData.amenities.split(',').map(item => item.trim());
        formDataToSend.append('features', JSON.stringify(amenitiesArray));
      }

      // Add vehicle image if available
      if (formData.vehicleImage) {
        formDataToSend.append('vehicleImage', formData.vehicleImage);
      }

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to register a vehicle');
      }

      // Make API call to register vehicle
      const response = await fetch('http://localhost:5000/api/vehicles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Vehicle registration failed');
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Vehicle registered successfully!');
        navigate('/driver/dashboard');
      } else {
        throw new Error(data.message || 'Vehicle registration failed');
      }
    } catch (error) {
      console.error('Vehicle registration error:', error);
      setSubmitError(error.message || 'Vehicle registration failed. Please try again.');
      toast.error(error.message || 'Vehicle registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Register Your Vehicle
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Provide details about your vehicle to start receiving bookings
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {submitError && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">
                Vehicle Type
              </label>
              <div className="mt-1">
                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                  <option value="suv">SUV</option>
                  <option value="bus">Mini Bus</option>
                  <option value="tuk">Tuk Tuk</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700">
                Vehicle Make
              </label>
              <div className="mt-1">
                <input
                  id="make"
                  name="make"
                  type="text"
                  required
                  value={formData.make}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. Toyota, Honda, etc."
                />
                {errors.make && (
                  <p className="mt-1 text-sm text-red-600">{errors.make}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                Vehicle Model
              </label>
              <div className="mt-1">
                <input
                  id="model"
                  name="model"
                  type="text"
                  required
                  value={formData.model}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. Corolla, Civic, etc."
                />
                {errors.model && (
                  <p className="mt-1 text-sm text-red-600">{errors.model}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700">
                License Plate Number
              </label>
              <div className="mt-1">
                <input
                  id="licensePlate"
                  name="licensePlate"
                  type="text"
                  required
                  value={formData.licensePlate}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. ABC-1234"
                />
                {errors.licensePlate && (
                  <p className="mt-1 text-sm text-red-600">{errors.licensePlate}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                Passenger Capacity
              </label>
              <div className="mt-1">
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  required
                  value={formData.capacity}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Number of passengers"
                />
                {errors.capacity && (
                  <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <div className="mt-1">
                <input
                  id="year"
                  name="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  required
                  value={formData.year}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Vehicle year"
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600">{errors.year}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="pricePerDay" className="block text-sm font-medium text-gray-700">
                Price Per Day (LKR)
              </label>
              <div className="mt-1">
                <input
                  id="pricePerDay"
                  name="pricePerDay"
                  type="number"
                  min="1"
                  required
                  value={formData.pricePerDay}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Daily rental price"
                />
                {errors.pricePerDay && (
                  <p className="mt-1 text-sm text-red-600">{errors.pricePerDay}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="amenities" className="block text-sm font-medium text-gray-700">
                Amenities (comma separated)
              </label>
              <div className="mt-1">
                <input
                  id="amenities"
                  name="amenities"
                  type="text"
                  value={formData.amenities}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. AC, WiFi, Water, GPS"
                />
                {errors.amenities && (
                  <p className="mt-1 text-sm text-red-600">{errors.amenities}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="vehicleImage" className="block text-sm font-medium text-gray-700">
                Vehicle Image (Optional)
              </label>
              <div className="mt-1">
                <input
                  id="vehicleImage"
                  name="vehicleImage"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.vehicleImage && (
                  <p className="mt-1 text-sm text-red-600">{errors.vehicleImage}</p>
                )}
                {previewImage && (
                  <div className="mt-2">
                    <img src={previewImage} alt="Vehicle preview" className="h-40 w-full object-cover rounded" />
                  </div>
                )}
              </div>
            </div>


            <div className="flex items-center">
              <input
                id="isAvailable"
                name="isAvailable"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                defaultChecked
              />
              <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
                Available for bookings immediately
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {loading ? 'Registering Vehicle...' : 'Register Vehicle'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-sm text-center text-gray-500">
            <p>You'll be able to add more vehicles later from your dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleRegistration;