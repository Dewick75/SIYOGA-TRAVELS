import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Component to redirect from /register/driver to /register/driver/new
 * This is used to maintain backward compatibility with existing links
 */
const RedirectToNewDriverRegistration = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new driver registration page
    navigate('/register/driver/new', { replace: true });
  }, [navigate]);

  return null; // This component doesn't render anything
};

export default RedirectToNewDriverRegistration;
