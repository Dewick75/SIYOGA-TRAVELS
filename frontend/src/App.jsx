import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import NewTouristRegister from './pages/auth/NewTouristRegister';
import RedirectToNewRegistration from './components/common/RedirectToNewRegistration';
import RedirectToNewDriverRegistration from './components/common/RedirectToNewDriverRegistration';
import DriverRegister from './pages/auth/DriverRegistration';
import NewDriverRegister from './pages/auth/NewDriverRegister';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import OtpVerification from './pages/auth/OtpVerification';
import DriverOtpVerification from './pages/auth/DriverOtpVerification';
import VehicleRegistration from './pages/driver/VehicleRegistration';
import SearchDestinations from './pages/tourist/SearchDestinations';
import PlanTrip from './pages/tourist/PlanTrip';
import SelectVehicle from './pages/tourist/SelectVehicle';
import Payment from './pages/tourist/Payment';
import BookingConfirmation from './pages/tourist/BookingConfirmation';
import TouristDashboard from './pages/tourist/Dashboard';
import TripDetail from './pages/tourist/TripDetail';
import ReviewTrip from './pages/tourist/ReviewTrip';
import TouristProfile from './pages/tourist/TouristProfile';
import DriverDashboard from './pages/driver/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import DestinationManagement from './pages/admin/DestinationManagement';
import TouristManagement from './pages/admin/TouristManagement';
import DriverManagement from './pages/admin/DriverManagement';
import DriverDetails from './pages/admin/DriverDetails';
import Reports from './pages/admin/Reports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminRegistration from './pages/admin/AdminRegistration';
import NotFound from './pages/NotFound';
import ProfileImageTest from './pages/test/ProfileImageTest';
import DirectImageTest from './pages/test/DirectImageTest';
import MapSearchTest from './pages/test/MapSearchTest';
import TestSelectVehicle from './pages/tourist/TestSelectVehicle';
import PaymentMethod from './pages/tourist/PaymentMethod';
import BookingSuccess from './pages/tourist/BookingSuccess';
import MultiDestinationTripPlanner from './pages/tourist/MultiDestinationTripPlanner';
import TripPreferences from './pages/tourist/TripPreferences';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
          <main className="flex-grow">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register/tourist" element={<RedirectToNewRegistration />} />
              <Route path="/register/tourist/new" element={<NewTouristRegister />} />
              <Route path="/register/driver" element={<RedirectToNewDriverRegistration />} />
              <Route path="/register/driver/new" element={<NewDriverRegister />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/verify-otp" element={<OtpVerification />} />
              <Route path="/verify-driver-otp" element={<DriverOtpVerification />} />

              {/* Protected routes for tourists */}
              <Route
                path="/destinations"
                element={<SearchDestinations />}
              />
              <Route
                path="/plan-trip/:destinationId"
                element={<PlanTrip />}
              />
              <Route
                path="/select-vehicle"
                element={<SelectVehicle />}
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <Payment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking-confirmation"
                element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <BookingConfirmation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tourist/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <TouristDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trip-detail/:bookingId"
                element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <TripDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/review-trip/:bookingId"
                element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <ReviewTrip />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tourist/profile"
                element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <TouristProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/modify-booking/:bookingId"
                element={
                  <ProtectedRoute allowedRoles={['tourist']}>
                    <PlanTrip isModifying={true} />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes for drivers */}
              <Route
                path="/driver/vehicle-registration"
                element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <VehicleRegistration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['driver']}>
                    <DriverDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes for admins */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/destinations"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DestinationManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tourists"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <TouristManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/drivers"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DriverManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/drivers/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DriverDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />

              {/* Admin Registration - Public route */}
              <Route path="/admin/register" element={<AdminRegistration />} />

              {/* Multi-destination trip planning routes */}
              <Route path="/multi-destination-trip" element={<MultiDestinationTripPlanner />} />
              <Route path="/trip-preferences" element={<TripPreferences />} />

              {/* Test routes */}
              <Route path="/test/profile-images" element={<ProfileImageTest />} />
              <Route path="/test/direct-image" element={<DirectImageTest />} />
              <Route path="/test/map-search" element={<MapSearchTest />} />
              <Route path="/test/select-vehicle" element={<TestSelectVehicle />} />
              <Route path="/test/payment-method" element={<PaymentMethod />} />
              <Route path="/booking-success" element={<BookingSuccess />} />

              {/* 404 Not Found route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;