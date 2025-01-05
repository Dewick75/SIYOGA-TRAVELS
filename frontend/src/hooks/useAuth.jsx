// import { useContext } from 'react';
// import { AuthContext } from '../context/AuthContext';

// export const useAuth = () => {
//   const context = useContext(AuthContext);
  
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
  
//   return context;
// };

// export default useAuth;


//Leaes Code Below

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;

//--------------------------------------------------

// import { useContext } from 'react';
// import { AuthContext } from '../context/AuthContext';

// // Custom hook to access auth context
// const useAuth = () => {
//   const context = useContext(AuthContext);
  
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
  
//   return context;
// };

// export default useAuth;

//______________________________________________

// import { useContext } from 'react';
// import { AuthContext } from '../context/AuthContext';

// // Custom hook to access auth context
// const useAuth = () => {
//   const context = useContext(AuthContext);
  
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
  
//   return context;
// };

// export default useAuth;