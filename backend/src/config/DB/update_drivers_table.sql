-- Update Drivers table with additional fields
USE TripBookingSystem;
GO

-- Check if ProfilePicture column exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Drivers' AND COLUMN_NAME = 'ProfilePicture')
BEGIN
    ALTER TABLE Drivers
    ADD ProfilePicture NVARCHAR(MAX) NULL;
END

-- Check if Biography column exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Drivers' AND COLUMN_NAME = 'Biography')
BEGIN
    ALTER TABLE Drivers
    ADD Biography NVARCHAR(MAX) NULL;
END

-- Check if ExperienceYears column exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Drivers' AND COLUMN_NAME = 'ExperienceYears')
BEGIN
    ALTER TABLE Drivers
    ADD ExperienceYears INT NULL;
END

-- Check if ReviewCount column exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Drivers' AND COLUMN_NAME = 'ReviewCount')
BEGIN
    ALTER TABLE Drivers
    ADD ReviewCount INT DEFAULT 0;
END

-- Check if UpdatedAt column exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Drivers' AND COLUMN_NAME = 'UpdatedAt')
BEGIN
    ALTER TABLE Drivers
    ADD UpdatedAt DATETIME NULL;
END

-- Rename JoinDate to RegistrationDate if it exists
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Drivers' AND COLUMN_NAME = 'JoinDate')
BEGIN
    EXEC sp_rename 'Drivers.JoinDate', 'RegistrationDate', 'COLUMN';
END
