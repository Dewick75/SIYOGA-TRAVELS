-- Update Vehicles table with additional fields
USE TripBookingSystem;
GO

-- Check if UpdatedAt column exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Vehicles' AND COLUMN_NAME = 'UpdatedAt')
BEGIN
    ALTER TABLE Vehicles
    ADD UpdatedAt DATETIME NULL;
END
