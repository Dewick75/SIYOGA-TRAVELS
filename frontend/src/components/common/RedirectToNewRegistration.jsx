import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Component that redirects from the old tourist registration page to the new one
 */
const RedirectToNewRegistration = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new registration page
    navigate('/register/tourist/new', { replace: true });
  }, [navigate]);

  // Return null as this component doesn't render anything
  return null;
};

export default RedirectToNewRegistration;
