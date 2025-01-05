import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

// Common chart options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
  },
};

/**
 * Component to render different types of charts based on report data
 */
const ReportCharts = ({ reportType, reportData }) => {
  if (!reportData || reportData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">No data available for visualization</p>
      </div>
    );
  }

  // Render different charts based on report type
  switch (reportType) {
    case 'revenue':
      return <RevenueCharts data={reportData} />;
    case 'bookings':
      return <BookingsCharts data={reportData} />;
    case 'drivers':
      return <DriversCharts data={reportData} />;
    case 'destinations':
      return <DestinationsCharts data={reportData} />;
    default:
      return (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">No visualization available for this report type</p>
        </div>
      );
  }
};

/**
 * Revenue report charts
 */
const RevenueCharts = ({ data }) => {
  // Prepare data for line chart
  const dates = data.map(item => new Date(item.Date).toLocaleDateString());
  const bookingCounts = data.map(item => item.BookingCount);
  const revenues = data.map(item => item.Revenue);

  const lineChartData = {
    labels: dates,
    datasets: [
      {
        label: 'Bookings',
        data: bookingCounts,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Revenue (LKR)',
        data: revenues,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        yAxisID: 'y1',
      },
    ],
  };

  const lineChartOptions = {
    ...commonOptions,
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Number of Bookings',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Revenue (LKR)',
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded-lg shadow h-80">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue & Bookings Over Time</h3>
        <Line data={lineChartData} options={lineChartOptions} />
      </div>
      <div className="bg-white p-4 rounded-lg shadow h-80">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Booking Count</h3>
        <Bar 
          data={{
            labels: dates,
            datasets: [
              {
                label: 'Bookings',
                data: bookingCounts,
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
              },
            ],
          }} 
          options={commonOptions} 
        />
      </div>
    </div>
  );
};

/**
 * Bookings report charts
 */
const BookingsCharts = ({ data }) => {
  // Count bookings by status
  const statusCounts = data.reduce((acc, booking) => {
    const status = booking.Status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Count bookings by payment status
  const paymentStatusCounts = data.reduce((acc, booking) => {
    const status = booking.PaymentStatus || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Prepare data for pie charts
  const statusPieData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const paymentStatusPieData = {
    labels: Object.keys(paymentStatusCounts),
    datasets: [
      {
        data: Object.values(paymentStatusCounts),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded-lg shadow h-80">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bookings by Status</h3>
        <div className="h-64">
          <Pie data={statusPieData} options={commonOptions} />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow h-80">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bookings by Payment Status</h3>
        <div className="h-64">
          <Doughnut data={paymentStatusPieData} options={commonOptions} />
        </div>
      </div>
    </div>
  );
};

/**
 * Drivers report charts
 */
const DriversCharts = ({ data }) => {
  // Sort drivers by trip count
  const sortedDrivers = [...data].sort((a, b) => b.TripCount - a.TripCount).slice(0, 10);
  
  // Prepare data for bar charts
  const driverNames = sortedDrivers.map(driver => driver.Name);
  const tripCounts = sortedDrivers.map(driver => driver.TripCount);
  const completedTrips = sortedDrivers.map(driver => driver.CompletedTrips);
  const cancelledTrips = sortedDrivers.map(driver => driver.CancelledTrips);
  const ratings = sortedDrivers.map(driver => driver.Rating || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded-lg shadow h-80">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Drivers by Trip Count</h3>
        <Bar 
          data={{
            labels: driverNames,
            datasets: [
              {
                label: 'Total Trips',
                data: tripCounts,
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
              },
              {
                label: 'Completed Trips',
                data: completedTrips,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
              },
              {
                label: 'Cancelled Trips',
                data: cancelledTrips,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
              },
            ],
          }} 
          options={{
            ...commonOptions,
            scales: {
              x: {
                stacked: false,
              },
              y: {
                stacked: false,
                title: {
                  display: true,
                  text: 'Number of Trips',
                },
              },
            },
          }} 
        />
      </div>
      <div className="bg-white p-4 rounded-lg shadow h-80">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Driver Ratings</h3>
        <Bar 
          data={{
            labels: driverNames,
            datasets: [
              {
                label: 'Rating',
                data: ratings,
                backgroundColor: 'rgba(255, 206, 86, 0.5)',
              },
            ],
          }} 
          options={{
            ...commonOptions,
            scales: {
              y: {
                min: 0,
                max: 5,
                title: {
                  display: true,
                  text: 'Rating (0-5)',
                },
              },
            },
          }} 
        />
      </div>
    </div>
  );
};

/**
 * Destinations report charts
 */
const DestinationsCharts = ({ data }) => {
  // Sort destinations by booking count
  const sortedDestinations = [...data].sort((a, b) => b.BookingCount - a.BookingCount).slice(0, 10);
  
  // Prepare data for charts
  const destinationNames = sortedDestinations.map(dest => dest.Name);
  const bookingCounts = sortedDestinations.map(dest => dest.BookingCount);
  const revenues = sortedDestinations.map(dest => dest.Revenue);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded-lg shadow h-80">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Destinations by Booking Count</h3>
        <Bar 
          data={{
            labels: destinationNames,
            datasets: [
              {
                label: 'Bookings',
                data: bookingCounts,
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
              },
            ],
          }} 
          options={commonOptions} 
        />
      </div>
      <div className="bg-white p-4 rounded-lg shadow h-80">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Destination</h3>
        <Pie 
          data={{
            labels: destinationNames,
            datasets: [
              {
                data: revenues,
                backgroundColor: [
                  'rgba(75, 192, 192, 0.6)',
                  'rgba(255, 99, 132, 0.6)',
                  'rgba(54, 162, 235, 0.6)',
                  'rgba(255, 206, 86, 0.6)',
                  'rgba(153, 102, 255, 0.6)',
                  'rgba(255, 159, 64, 0.6)',
                  'rgba(201, 203, 207, 0.6)',
                  'rgba(255, 205, 86, 0.6)',
                  'rgba(75, 192, 192, 0.6)',
                  'rgba(54, 162, 235, 0.6)',
                ],
                borderWidth: 1,
              },
            ],
          }} 
          options={commonOptions} 
        />
      </div>
    </div>
  );
};

export default ReportCharts;
