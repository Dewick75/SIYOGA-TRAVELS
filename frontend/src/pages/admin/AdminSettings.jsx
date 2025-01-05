import { useState } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import AdminNavbar from '../../components/admin/AdminNavbar';

function AdminSettings() {
  const { user } = useAuth();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [newAdminData, setNewAdminData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Admin'
  });
  const [newAdminErrors, setNewAdminErrors] = useState({});
  const [newAdminLoading, setNewAdminLoading] = useState(false);

  // Handle password form input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle new admin form input change
  const handleNewAdminChange = (e) => {
    const { name, value } = e.target;
    setNewAdminData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (newAdminErrors[name]) {
      setNewAdminErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate password form
  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  // Validate new admin form
  const validateNewAdminForm = () => {
    const errors = {};

    if (!newAdminData.name) {
      errors.name = 'Name is required';
    }

    if (!newAdminData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newAdminData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!newAdminData.password) {
      errors.password = 'Password is required';
    } else if (newAdminData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!newAdminData.role) {
      errors.role = 'Role is required';
    }

    return errors;
  };

  // Handle password change submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const formErrors = validatePasswordForm();
    if (Object.keys(formErrors).length > 0) {
      setPasswordErrors(formErrors);
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await adminService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data && response.data.success) {
        toast.success('Password changed successfully');
        // Reset form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error(response.data?.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to change password';
      toast.error(errorMessage);

      // Set specific error if it's about current password
      if (errorMessage.toLowerCase().includes('current password')) {
        setPasswordErrors({ currentPassword: errorMessage });
      } else {
        setPasswordErrors({ submit: errorMessage });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle new admin submission
  const handleNewAdminSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const formErrors = validateNewAdminForm();
    if (Object.keys(formErrors).length > 0) {
      setNewAdminErrors(formErrors);
      return;
    }

    setNewAdminLoading(true);

    try {
      const response = await adminService.createAdmin(newAdminData);

      if (response.data && response.data.success) {
        toast.success('New admin user created successfully');
        // Reset form
        setNewAdminData({
          name: '',
          email: '',
          password: '',
          role: 'Admin'
        });
      } else {
        throw new Error(response.data?.message || 'Failed to create admin user');
      }
    } catch (err) {
      console.error('Error creating admin user:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create admin user';
      toast.error(errorMessage);

      // Set specific error if it's about email
      if (errorMessage.toLowerCase().includes('email')) {
        setNewAdminErrors({ email: errorMessage });
      } else {
        setNewAdminErrors({ submit: errorMessage });
      }
    } finally {
      setNewAdminLoading(false);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your admin account and system settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Change Password */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Change Password</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Update your admin account password</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={`mt-1 block w-full border ${passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-2 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={`mt-1 block w-full border ${passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
                {passwordErrors.newPassword && (
                  <p className="mt-2 text-sm text-red-600">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`mt-1 block w-full border ${passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              {passwordErrors.submit && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{passwordErrors.submit}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {passwordLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Create New Admin (Super Admin Only) */}
        {user?.IsSuperAdmin && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Admin</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Add a new administrator to the system</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <form onSubmit={handleNewAdminSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={newAdminData.name}
                    onChange={handleNewAdminChange}
                    className={`mt-1 block w-full border ${newAdminErrors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                  />
                  {newAdminErrors.name && (
                    <p className="mt-2 text-sm text-red-600">{newAdminErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={newAdminData.email}
                    onChange={handleNewAdminChange}
                    className={`mt-1 block w-full border ${newAdminErrors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                  />
                  {newAdminErrors.email && (
                    <p className="mt-2 text-sm text-red-600">{newAdminErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={newAdminData.password}
                    onChange={handleNewAdminChange}
                    className={`mt-1 block w-full border ${newAdminErrors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                  />
                  {newAdminErrors.password && (
                    <p className="mt-2 text-sm text-red-600">{newAdminErrors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={newAdminData.role}
                    onChange={handleNewAdminChange}
                    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md ${newAdminErrors.role ? 'border-red-300' : ''}`}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Support">Support</option>
                  </select>
                  {newAdminErrors.role && (
                    <p className="mt-2 text-sm text-red-600">{newAdminErrors.role}</p>
                  )}
                </div>

                {newAdminErrors.submit && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{newAdminErrors.submit}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={newAdminLoading}
                    className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {newAdminLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Admin'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default AdminSettings;
