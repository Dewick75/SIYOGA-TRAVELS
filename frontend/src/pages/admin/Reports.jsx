import { useState } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import AdminNavbar from '../../components/admin/AdminNavbar';

function Reports() {
  const [reportType, setReportType] = useState('drivers');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportTitle, setReportTitle] = useState('');

  // Handle report type change
  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
    setReportData(null);
  };

  // Handle date range change
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Generate report
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const params = {
        ...dateRange
      };

      console.log(`Generating ${reportType} report with params:`, params);
      const response = await adminService.generateReport(reportType, params);

      if (response.data && response.data.success) {
        console.log('Report data received:', response.data);
        setReportData(response.data.data);
        setReportTitle(response.data.title || getReportTitle(reportType));
        toast.success('Report generated successfully');
      } else {
        console.warn('Report response not successful:', response);
        throw new Error('Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError(`Failed to generate report: ${err.message || 'Unknown error'}`);
      toast.error('Failed to generate report. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Get report title based on type
  const getReportTitle = (type) => {
    switch (type) {
      case 'drivers':
        return 'Driver Performance Report';
      case 'bookings':
        return 'Bookings Report';
      case 'revenue':
        return 'Revenue Report';
      case 'destinations':
        return 'Destination Popularity Report';
      default:
        return 'Report';
    }
  };

  // Export report as CSV
  const handleExportCSV = () => {
    if (!reportData) return;

    try {
      // Convert report data to CSV
      const headers = Object.keys(reportData[0]);
      const csvContent = [
        headers.join(','),
        ...reportData.map(row =>
          headers.map(header => {
            const value = row[header];
            // Handle values with commas by wrapping in quotes
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value;
          }).join(',')
        )
      ].join('\n');

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Report exported successfully');
    } catch (err) {
      console.error('Error exporting report:', err);
      toast.error('Failed to export report');
    }
  };

  // Render report table based on type
  const renderReportTable = () => {
    if (!reportData || reportData.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-64 bg-white">
          <svg className="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-2 text-gray-500">No report data available</p>
        </div>
      );
    }

    // Get table headers based on report type
    const headers = Object.keys(reportData[0]);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900"
                >
                  {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {reportData.map((row, index) => (
              <tr key={index}>
                {headers.map((header) => (
                  <td key={`${index}-${header}`} className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                    {typeof row[header] === 'number' && header.toLowerCase().includes('amount')
                      ? `LKR ${row[header].toLocaleString()}`
                      : row[header] instanceof Date
                        ? new Date(row[header]).toLocaleDateString()
                        : row[header] === null
                          ? 'N/A'
                          : row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and export system reports
          </p>
        </div>
      </div>

      {/* Report Generator Form */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Report Generator</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Select report type and parameters</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <form onSubmit={handleGenerateReport} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="report-type" className="block text-sm font-medium text-gray-700">
                  Report Type
                </label>
                <select
                  id="report-type"
                  name="reportType"
                  value={reportType}
                  onChange={handleReportTypeChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  <option value="drivers">Driver Performance</option>
                  <option value="bookings">Bookings</option>
                  <option value="revenue">Revenue</option>
                  <option value="destinations">Destination Popularity</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  id="start-date"
                  value={dateRange.startDate}
                  onChange={handleDateRangeChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  id="end-date"
                  value={dateRange.endDate}
                  onChange={handleDateRangeChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Results */}
      {reportData && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">{reportTitle}</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {dateRange.startDate && dateRange.endDate
                  ? `${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}`
                  : 'All time'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
          <div className="border-t border-gray-200">
            {renderReportTable()}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default Reports;
