import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import destinationService from '../../services/destinationService';

function SearchDestinations() {
  const [destinations, setDestinations] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch destinations from the API
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        const result = await destinationService.getAllDestinations();

        if (result && result.success) {
          // Transform the data to match our component's expected format
          const formattedDestinations = result.data.map(dest => ({
            id: dest.DestinationID,
            name: dest.Name,
            location: dest.Location,
            description: dest.Description,
            imageUrl: destinationService.formatImageUrl(dest.ImageURL),
            activities: dest.Activities || []
          }));

          setDestinations(formattedDestinations);
          setFilteredDestinations(formattedDestinations);
        } else {
          throw new Error('Failed to fetch destinations');
        }
      } catch (err) {
        console.error('Error fetching destinations:', err);
        setError(err.message || 'Failed to load destinations');
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = destinations.filter(destination =>
        destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        destination.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDestinations(filtered);
    } else {
      setFilteredDestinations(destinations);
    }
  }, [searchTerm, destinations]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Error loading destinations</h3>
        <p className="mt-1 text-gray-500">{error}</p>
        <button
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          onClick={() => {
            setError(null);
            setLoading(true);
            // Retry fetching destinations
            destinationService.getAllDestinations()
              .then(result => {
                if (result && result.success) {
                  const formattedDestinations = result.data.map(dest => ({
                    id: dest.DestinationID,
                    name: dest.Name,
                    location: dest.Location,
                    description: dest.Description,
                    imageUrl: destinationService.formatImageUrl(dest.ImageURL),
                    activities: dest.Activities || []
                  }));

                  setDestinations(formattedDestinations);
                  setFilteredDestinations(formattedDestinations);
                } else {
                  throw new Error('Failed to fetch destinations');
                }
              })
              .catch(err => {
                console.error('Error retrying destination fetch:', err);
                setError(err.message || 'Failed to load destinations');
              })
              .finally(() => {
                setLoading(false);
              });
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Find Your Next Destination
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Discover beautiful places in Sri Lanka and plan your perfect trip.
        </p>
      </div>

      <div className="mt-10 max-w-xl mx-auto">
        <div className="flex rounded-md shadow-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search destinations by name or location..."
            className="flex-1 min-w-0 block w-full px-3 py-3 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300"
          />
          <button
            type="button"
            className="inline-flex items-center px-4 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredDestinations.length > 0 ? (
          filteredDestinations.map(destination => (
            <div key={destination.id} className="flex flex-col rounded-lg shadow-md overflow-hidden">
              <div className="flex-shrink-0">
                <img className="h-48 w-full object-cover" src={destination.imageUrl} alt={destination.name} />
              </div>
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-600">
                    {destination.location}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-gray-900">
                    {destination.name}
                  </h3>
                  <p className="mt-3 text-base text-gray-500">
                    {destination.description}
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    to={`/plan-trip/${destination.id}`}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-primary-600 hover:bg-primary-700"
                  >
                    Plan a Trip
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No destinations found</h3>
            <p className="mt-1 text-sm text-gray-500">Try a different search term or browse all destinations.</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all destinations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchDestinations;
