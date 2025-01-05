import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Siyoga Travels</h3>
            <p className="text-gray-300 text-sm">
              Your trusted partner for travel planning and vehicle booking in Sri Lanka.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/destinations" className="hover:text-white">Destinations</Link></li>
              <li><Link to="/about" className="hover:text-white">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">For Tourists</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/register/tourist" className="hover:text-white">Sign Up</Link></li>
              <li><Link to="/login" className="hover:text-white">Login</Link></li>
              <li><Link to="/destinations" className="hover:text-white">Book a Trip</Link></li>
              <li><Link to="/multi-destination-trip" className="hover:text-white">Multi-Destination Trip</Link></li>
              <li><Link to="/faq" className="hover:text-white">FAQs</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">For Drivers</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/register/driver" className="hover:text-white">Register Driver</Link></li>
              <li><Link to="/login" className="hover:text-white">Driver Login</Link></li>
              <li><Link to="/driver/support" className="hover:text-white">Driver Support</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-sm text-gray-300">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} Siyoga Travels. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="#" className="hover:text-white">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;