// import { createContext, useState, useEffect } from 'react';
// import { authService } from '../services/api';

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     // Check if user is already logged in
//     const storedUser = localStorage.getItem('user');
//     if (storedUser) {
//       try {
//         setUser(JSON.parse(storedUser));
//       } catch (err) {
//         console.error('Failed to parse stored user:', err);
//         localStorage.removeItem('user');
//       }
//     }
//     setLoading(false);
//   }, []);

//   const login = async (email, password, userType) => {
//     try {
//       setError(null);
//       setLoading(true);
      
//       // In a real implementation, this would call the API with the userType
//       console.log(`Logging in as ${userType} with email: ${email}`);
      
//       // For now, simulating a successful login
//       const userData = {
//         id: 1,
//         name: userType === 'tourist' ? 'John Tourist' : userType === 'driver' ? 'John Driver' : 'Admin User',
//         email,
//         role: userType
//       };
//       const token = 'fake-jwt-token';
      
//       localStorage.setItem('token', token);
//       localStorage.setItem('user', JSON.stringify(userData));
      
//       setUser(userData);
//       setLoading(false);
//       return userData;
//     } catch (err) {
//       setError(err.response?.data?.message || 'Login failed');
//       setLoading(false);
//       throw err;
//     }
//   };

//   const register = async (userData, userType) => {
//     try {
//       setError(null);
//       setLoading(true);
      
//       // In a real implementation, this would call the API with the userData and userType
//       console.log(`Registering as ${userType} with data:`, userData);
      
//       // For now, simulating a successful registration
//       setLoading(false);
//       return { message: `Registration successful as ${userType}` };
//     } catch (err) {
//       setError(err.response?.data?.message || 'Registration failed');
//       setLoading(false);
//       throw err;
//     }
//   };

//   const logout = () => {
//     authService.logout();
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         loading,
//         error,
//         login,
//         register,
//         logout,
//         setUser
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export default AuthProvider;

//-------------------------------------------------------------------


// import { createContext, useState, useEffect } from 'react';

// export const AuthContext = createContext();

// const AuthProvider = ({ children }) => {
//   const [currentUser, setCurrentUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Check if user is already logged in from localStorage
//     const checkLoggedIn = () => {
//       const userJson = localStorage.getItem('user');
//       if (userJson) {
//         try {
//           const userData = JSON.parse(userJson);
//           setCurrentUser(userData);
//         } catch (error) {
//           console.error('Failed to parse user data', error);
//           localStorage.removeItem('user');
//         }
//       }
//       setLoading(false);
//     };

//     checkLoggedIn();
//   }, []);

//   // Login function
//   const login = (userData) => {
//     localStorage.setItem('user', JSON.stringify(userData));
//     setCurrentUser(userData);
//     return true;
//   };

//   // Logout function
//   const logout = () => {
//     localStorage.removeItem('user');
//     setCurrentUser(null);
//   };

//   // Check if user is authenticated
//   const isAuthenticated = () => {
//     return !!currentUser;
//   };

//   // Check if user has specific role
//   const hasRole = (roles) => {
//     if (!currentUser) return false;
//     if (Array.isArray(roles)) {
//       return roles.includes(currentUser.role);
//     }
//     return currentUser.role === roles;
//   };

//   const value = {
//     currentUser,
//     login,
//     logout,
//     isAuthenticated,
//     hasRole,
//     loading
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export default AuthProvider;


//________________________________________________
import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const checkLoggedIn = () => {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          setUser(userData);
        } catch (error) {
          console.error('Failed to parse user data:', error);
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (userData) => {
    try {
      // Ensure userData has a role
      if (!userData || !userData.role) {
        throw new Error('Invalid user data: Role is required');
      }

      // Store in localStorage and update state
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user has specific role
  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    hasRole,
    loading,
    setLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;