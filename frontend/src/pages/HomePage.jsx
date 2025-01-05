import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-800 to-secondary-800 opacity-75"></div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Plan Your Next Trip and Book the Perfect Ride
          </h1>
          <p className="mt-6 text-xl text-gray-100 max-w-3xl">
            Experience Sri Lanka with our seamless travel planning and vehicle booking platform. Direct bookings, no intermediaries, lower costs.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              to="/destinations"
              className="rounded-md bg-primary-600 px-6 py-3 text-lg font-medium text-white shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-center"
            >
              Find Destinations
            </Link>
            <Link
              to="/multi-destination-trip"
              className="rounded-md bg-secondary-600 px-6 py-3 text-lg font-medium text-white shadow hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 text-center"
            >
              Plan Multi-Destination Trip
            </Link>
            <Link
              to="/register/tourist"
              className="rounded-md bg-white px-6 py-3 text-lg font-medium text-gray-900 shadow hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-center"
            >
              Sign Up Now
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Choose Siyoga Travels?
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Our platform connects tourists directly with drivers, eliminating the need for intermediaries and reducing costs.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
              <div className="bg-primary-100 rounded-full p-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900">Direct Trip Orders</h3>
              <p className="mt-2 text-gray-500">
                Book your trips directly with drivers, eliminating intermediaries and reducing costs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
              <div className="bg-primary-100 rounded-full p-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900">Secure Payments</h3>
              <p className="mt-2 text-gray-500">
                Make secure online payments with confidence, with full transparency on pricing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
              <div className="bg-primary-100 rounded-full p-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900">Trip Planning</h3>
              <p className="mt-2 text-gray-500">
                Plan your entire trip itinerary including destinations, schedules and activities.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
              <div className="bg-primary-100 rounded-full p-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900">Driver Reviews</h3>
              <p className="mt-2 text-gray-500">
                Read and write reviews to ensure you travel with trusted and reliable drivers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to start your journey?</span>
            <span className="block text-primary-300">Join Siyoga Travels today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/register/tourist/new"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Register as Tourist
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to="/register/driver"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-800 hover:bg-primary-900"
              >
                Register as Driver
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;