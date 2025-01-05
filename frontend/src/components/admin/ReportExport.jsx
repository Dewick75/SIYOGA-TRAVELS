import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Component for exporting reports in different formats
 */
const ReportExport = ({ reportType, reportData, reportTitle, dateRange }) => {
  if (!reportData || reportData.length === 0) {
    return null;
  }

  // Export report as PDF
  const handleExportPDF = () => {
    try {
      // Create new PDF document
      const doc = new jsPDF();
      
      // Add title and date range
      doc.setFontSize(18);
      doc.text(reportTitle, 14, 22);
      
      doc.setFontSize(11);
      const dateText = dateRange.startDate && dateRange.endDate
        ? `Period: ${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}`
        : 'Period: All time';
      doc.text(dateText, 14, 30);
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);
      
      // Add Siyoga Travels header
      doc.setFontSize(20);
      doc.setTextColor(0, 51, 153);
      doc.text('Siyoga Travels', 14, 15);
      doc.setTextColor(0, 0, 0);
      
      // Add horizontal line
      doc.setDrawColor(0, 51, 153);
      doc.setLineWidth(0.5);
      doc.line(14, 17, 196, 17);
      
      // Get table headers and format them
      const headers = Object.keys(reportData[0]).map(header => 
        header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      );
      
      // Prepare table data
      const data = reportData.map(row => 
        Object.values(row).map(value => {
          if (value instanceof Date) {
            return new Date(value).toLocaleDateString();
          } else if (value === null) {
            return 'N/A';
          } else {
            return value;
          }
        })
      );
      
      // Add table to PDF
      doc.autoTable({
        head: [headers],
        body: data,
        startY: 45,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 51, 153], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { top: 45 },
      });
      
      // Add summary section based on report type
      addReportSummary(doc, reportType, reportData);
      
      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${i} of ${pageCount} - Siyoga Travels Admin Report`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // Save the PDF
      doc.save(`${reportTitle.replace(/\\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      return true;
    } catch (err) {
      console.error('Error exporting PDF:', err);
      return false;
    }
  };
  
  // Export report as Excel
  const handleExportExcel = () => {
    try {
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(reportData);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, reportTitle);
      
      // Generate Excel file
      XLSX.writeFile(wb, `${reportTitle.replace(/\\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      return true;
    } catch (err) {
      console.error('Error exporting Excel:', err);
      return false;
    }
  };
  
  // Add summary section to PDF based on report type
  const addReportSummary = (doc, reportType, data) => {
    // Get current Y position after the table
    const finalY = doc.lastAutoTable.finalY || 150;
    
    doc.setFontSize(14);
    doc.text('Summary', 14, finalY + 10);
    
    doc.setFontSize(10);
    
    switch (reportType) {
      case 'revenue':
        const totalBookings = data.reduce((sum, item) => sum + item.BookingCount, 0);
        const totalRevenue = data.reduce((sum, item) => sum + item.Revenue, 0);
        
        doc.text(`Total Bookings: ${totalBookings}`, 14, finalY + 20);
        doc.text(`Total Revenue: LKR ${totalRevenue.toLocaleString()}`, 14, finalY + 26);
        break;
        
      case 'bookings':
        const statusCounts = data.reduce((acc, booking) => {
          const status = booking.Status || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        
        let yPos = finalY + 20;
        doc.text(`Total Bookings: ${data.length}`, 14, yPos);
        yPos += 6;
        
        Object.entries(statusCounts).forEach(([status, count]) => {
          doc.text(`${status}: ${count} (${((count / data.length) * 100).toFixed(1)}%)`, 14, yPos);
          yPos += 6;
        });
        break;
        
      case 'drivers':
        const totalTrips = data.reduce((sum, driver) => sum + (driver.TripCount || 0), 0);
        const completedTrips = data.reduce((sum, driver) => sum + (driver.CompletedTrips || 0), 0);
        const cancelledTrips = data.reduce((sum, driver) => sum + (driver.CancelledTrips || 0), 0);
        
        doc.text(`Total Drivers: ${data.length}`, 14, finalY + 20);
        doc.text(`Total Trips: ${totalTrips}`, 14, finalY + 26);
        doc.text(`Completed Trips: ${completedTrips} (${totalTrips ? ((completedTrips / totalTrips) * 100).toFixed(1) : 0}%)`, 14, finalY + 32);
        doc.text(`Cancelled Trips: ${cancelledTrips} (${totalTrips ? ((cancelledTrips / totalTrips) * 100).toFixed(1) : 0}%)`, 14, finalY + 38);
        break;
        
      case 'destinations':
        const totalDestBookings = data.reduce((sum, dest) => sum + dest.BookingCount, 0);
        const totalDestRevenue = data.reduce((sum, dest) => sum + dest.Revenue, 0);
        
        doc.text(`Total Destinations: ${data.length}`, 14, finalY + 20);
        doc.text(`Total Bookings: ${totalDestBookings}`, 14, finalY + 26);
        doc.text(`Total Revenue: LKR ${totalDestRevenue.toLocaleString()}`, 14, finalY + 32);
        break;
        
      default:
        doc.text(`Total Records: ${data.length}`, 14, finalY + 20);
    }
  };
  
  return (
    <div className="flex space-x-2">
      <button
        type="button"
        onClick={handleExportPDF}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export PDF
      </button>
      
      <button
        type="button"
        onClick={handleExportExcel}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export Excel
      </button>
    </div>
  );
};

export default ReportExport;
