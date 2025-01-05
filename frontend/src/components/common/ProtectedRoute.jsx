// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../../hooks/useAuth';

// function ProtectedRoute({ children, allowedRoles = [] }) {
//   const { user, loading } = useAuth();
//   const location = useLocation();

//   if (loading) {
//     // You could render a loading spinner here
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
//       </div>
//     );
//   }

//   // If not logged in, redirect to login page with the return url
//   if (!user) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   // If user doesn't have the required role
//   if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
//     // Redirect based on user role
//     if (user.role === 'tourist') {
//       return <Navigate to="/tourist/dashboard" replace />;
//     } else if (user.role === 'driver') {
//       return <Navigate to="/driver/dashboard" replace />;
//     } else if (user.role === 'admin') {
//       return <Navigate to="/admin/dashboard" replace />;
//     }

//     // Fallback to homepage
//     return <Navigate to="/" replace />;
//   }

//   // If user has the required role, render the children
//   return children;
// }

// export default ProtectedRoute;

//''''''''''''''''''''''''''''''''''

// import { Navigate, useLocation } from 'react-router-dom';
// import useAuth from '../../hooks/useAuth';

// const ProtectedRoute = ({ children, allowedRoles = [] }) => {
//   const { isAuthenticated, currentUser, loading } = useAuth();
//   const location = useLocation();

//   // Show loading state if still checking authentication
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
//       </div>
//     );
//   }

//   // If user is not authenticated, redirect to login
//   if (!isAuthenticated()) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   // If roles are specified but user doesn't have the required role
//   if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
//     // Redirect to appropriate dashboard based on user role
//     if (currentUser.role === 'tourist') {
//       return <Navigate to="/tourist/dashboard" replace />;
//     } else if (currentUser.role === 'driver') {
//       return <Navigate to="/driver/dashboard" replace />;
//     } else if (currentUser.role === 'admin') {
//       return <Navigate to="/admin/dashboard" replace />;
//     }

//     // Fallback to home page if role is not recognized
//     return <Navigate to="/" replace />;
//   }

//   // If authentication and authorization pass, render the protected component
//   return children;
// };

// export default ProtectedRoute;


//-------------------------------------------------
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute:', {
    path: location.pathname,
    isAuthenticated: isAuthenticated(),
    user,
    loading,
    allowedRoles
  });

  // Show loading state if still checking authentication
  if (loading) {
    console.log('ProtectedRoute: Still loading authentication state');
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated()) {
    console.log('ProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified but user doesn't have the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log(`ProtectedRoute: User role "${user.role}" not in allowed roles:`, allowedRoles);

    // Redirect to appropriate dashboard based on user role
    if (user.role === 'tourist') {
      console.log('ProtectedRoute: Redirecting tourist to tourist dashboard');
      return <Navigate to="/tourist/dashboard" replace />;
    } else if (user.role === 'driver') {
      console.log('ProtectedRoute: Redirecting driver to driver dashboard');
      return <Navigate to="/driver/dashboard" replace />;
    } else if (user.role === 'admin') {
      console.log('ProtectedRoute: Redirecting admin to admin dashboard');
      return <Navigate to="/admin/dashboard" replace />;
    }

    // Fallback to home page if role is not recognized
    console.log('ProtectedRoute: Unrecognized role, redirecting to home page');
    return <Navigate to="/" replace />;
  }

  // If authentication and authorization pass, render the protected component
  console.log('ProtectedRoute: Access granted to', location.pathname);
  return children;
};

export default ProtectedRoute;