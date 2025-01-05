-- Create the database
CREATE DATABASE SiyogaTravelSystem;
GO

USE SiyogaTravelSystem;
GO

-- Create Users table (Base table for all user types)
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL, -- Will be hashed
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Tourist', 'Driver', 'Admin')),
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLoginAt DATETIME NULL
);

-- Create Tourists table
CREATE TABLE Tourists (
    TouristID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT UNIQUE NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    PhoneNumber NVARCHAR(20) NULL,
    Country NVARCHAR(100) NULL,
    RegistrationDate DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'Active',
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Create Drivers table
CREATE TABLE Drivers (
    DriverID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT UNIQUE NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    PhoneNumber NVARCHAR(20) NOT NULL,
    LicenseNumber NVARCHAR(50) NOT NULL,
    JoinDate DATETIME DEFAULT GETDATE(),
    Rating DECIMAL(3, 2) DEFAULT 0.0,
    TotalTrips INT DEFAULT 0,
    Status NVARCHAR(20) DEFAULT 'Pending', -- Pending, Active, Inactive, Suspended
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Create Vehicles table
CREATE TABLE Vehicles (
    VehicleID INT PRIMARY KEY IDENTITY(1,1),
    DriverID INT NOT NULL,
    Type NVARCHAR(50) NOT NULL, -- Car, SUV, Van, etc.
    Make NVARCHAR(50) NOT NULL,
    Model NVARCHAR(50) NOT NULL,
    Year INT NOT NULL,
    LicensePlate NVARCHAR(20) UNIQUE NOT NULL,
    Capacity INT NOT NULL,
    PricePerDay DECIMAL(10, 2) NOT NULL,
    Features NVARCHAR(MAX) NULL, -- JSON array of features
    ImageURL NVARCHAR(MAX) NULL,
    Status NVARCHAR(20) DEFAULT 'Active', -- Active, Inactive, Maintenance
    FOREIGN KEY (DriverID) REFERENCES Drivers(DriverID) ON DELETE CASCADE
);

-- Create Destinations table
CREATE TABLE Destinations (
    DestinationID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Location NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    ImageURL NVARCHAR(MAX) NULL,
    Activities NVARCHAR(MAX) NULL, -- JSON array of activities
    Status NVARCHAR(20) DEFAULT 'Active', -- Active, Inactive
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL
);

-- Create Bookings table
CREATE TABLE Bookings (
    BookingID INT PRIMARY KEY IDENTITY(1,1),
    BookingNumber NVARCHAR(20) UNIQUE NOT NULL,
    TouristID INT NOT NULL,
    DestinationID INT NOT NULL,
    VehicleID INT NOT NULL,
    DriverID INT NOT NULL,
    TripDate DATE NOT NULL,
    TripTime TIME NOT NULL,
    NumTravelers INT NOT NULL,
    SpecialRequests NVARCHAR(MAX) NULL,
    BookingDate DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'Pending', -- Pending, Confirmed, Completed, Cancelled
    CancellationReason NVARCHAR(MAX) NULL,
    CancelledBy NVARCHAR(20) NULL, -- Tourist, Driver, Admin
    FOREIGN KEY (TouristID) REFERENCES Tourists(TouristID),
    FOREIGN KEY (DestinationID) REFERENCES Destinations(DestinationID),
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    FOREIGN KEY (DriverID) REFERENCES Drivers(DriverID)
);

-- Create Payments table
CREATE TABLE Payments (
    PaymentID INT PRIMARY KEY IDENTITY(1,1),
    BookingID INT UNIQUE NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    PaymentMethod NVARCHAR(50) NOT NULL, -- Credit Card, PayPal, etc.
    TransactionID NVARCHAR(100) NULL,
    PaymentDate DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) NOT NULL, -- Pending, Completed, Failed, Refunded
    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID)
);

-- Create Reviews table
CREATE TABLE Reviews (
    ReviewID INT PRIMARY KEY IDENTITY(1,1),
    BookingID INT UNIQUE NOT NULL,
    TouristID INT NOT NULL,
    DriverID INT NOT NULL,
    VehicleID INT NOT NULL,
    DriverRating INT NOT NULL CHECK (DriverRating BETWEEN 1 AND 5),
    VehicleRating INT NOT NULL CHECK (VehicleRating BETWEEN 1 AND 5),
    OverallRating INT NOT NULL CHECK (OverallRating BETWEEN 1 AND 5),
    Comment NVARCHAR(MAX) NULL,
    ReviewDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    FOREIGN KEY (TouristID) REFERENCES Tourists(TouristID),
    FOREIGN KEY (DriverID) REFERENCES Drivers(DriverID),
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID)
);

-- Create Admin table
CREATE TABLE Admins (
    AdminID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT UNIQUE NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Role NVARCHAR(50) DEFAULT 'General', -- General, Super Admin, etc.
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Create System Logs table
CREATE TABLE SystemLogs (
    LogID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NULL,
    Action NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    IPAddress NVARCHAR(50) NULL,
    LogDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE SET NULL
);


-- Update Tourists table with additional fields
ALTER TABLE Tourists
ADD DateOfBirth DATE NULL,
    Gender NVARCHAR(20) NULL,
    PreferredLanguage NVARCHAR(50) NULL DEFAULT 'English',
    EmergencyContactName NVARCHAR(100) NULL,
    EmergencyContactPhone NVARCHAR(20) NULL,
    ProfilePicture NVARCHAR(MAX) NULL,
    TravelPreferences NVARCHAR(MAX) NULL, -- JSON format
    UpdatedAt DATETIME NULL;





-- Add trigger to update the UpdatedAt field
CREATE TRIGGER trg_Tourists_UpdatedAt
ON Tourists
AFTER UPDATE
AS
BEGIN
    UPDATE Tourists
    SET UpdatedAt = GETDATE()
    FROM Tourists t
    INNER JOIN inserted i ON t.TouristID = i.TouristID
END;






-- Insert sample data for testing

-- Insert Admin user
INSERT INTO Users (Email, Password, Role)
VALUES ('admin@example.com', 'hashed_password_here', 'Admin');

INSERT INTO Admins (UserID, Name)
VALUES (SCOPE_IDENTITY(), 'System Administrator');

-- Insert sample destinations
INSERT INTO Destinations (Name, Location, Description, ImageURL, Activities)
VALUES 
('Sigiriya Rock Fortress', 'Dambulla, Central Province', 'An ancient rock fortress and palace with stunning views. The site was selected by King Kashyapa (477–495 AD) for his new capital.', 'https://via.placeholder.com/800x400?text=Sigiriya', N'["Rock Climbing", "Archaeological Tour", "Bird Watching"]'),
('Galle Fort', 'Galle, Southern Province', 'A historic fortified city founded by Portuguese colonists. The fort is a world heritage site and the largest remaining European-built fortress in Asia.', 'https://via.placeholder.com/800x400?text=Galle+Fort', N'["Walking Tour", "Lighthouse Visit", "Shopping"]'),
('Temple of the Sacred Tooth Relic', 'Kandy, Central Province', 'A Buddhist temple that houses the relic of the tooth of Buddha.', 'https://via.placeholder.com/800x400?text=Tooth+Temple', N'["Cultural Tour", "Religious Ceremony", "Photography"]'),
('Yala National Park', 'Yala, Southern Province', 'Famous for its leopard population and diverse wildlife.', 'https://via.placeholder.com/800x400?text=Yala+Park', N'["Safari Tour", "Wildlife Photography", "Camping"]');

-- Create stored procedures

-- Create SP for tourist registration
CREATE PROCEDURE sp_RegisterTourist
    @Email NVARCHAR(100),
    @Password NVARCHAR(255),
    @Name NVARCHAR(100),
    @PhoneNumber NVARCHAR(20) = NULL,
    @Country NVARCHAR(100) = NULL
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if email already exists
        IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
        BEGIN
            RAISERROR('Email already exists', 16, 1);
            RETURN;
        END
        
        -- Insert into Users table
        INSERT INTO Users (Email, Password, Role)
        VALUES (@Email, @Password, 'Tourist');
        
        DECLARE @UserID INT = SCOPE_IDENTITY();
        
        -- Insert into Tourists table
        INSERT INTO Tourists (UserID, Name, PhoneNumber, Country)
        VALUES (@UserID, @Name, @PhoneNumber, @Country);
        
        -- Log the registration
        INSERT INTO SystemLogs (UserID, Action, Description)
        VALUES (@UserID, 'Registration', 'Tourist registration completed');
        
        COMMIT TRANSACTION;
        
        -- Return the newly created TouristID
        SELECT T.TouristID FROM Tourists T WHERE T.UserID = @UserID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Create SP for driver registration
CREATE PROCEDURE sp_RegisterDriver
    @Email NVARCHAR(100),
    @Password NVARCHAR(255),
    @Name NVARCHAR(100),
    @PhoneNumber NVARCHAR(20),
    @LicenseNumber NVARCHAR(50)
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if email already exists
        IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
        BEGIN
            RAISERROR('Email already exists', 16, 1);
            RETURN;
        END
        
        -- Insert into Users table
        INSERT INTO Users (Email, Password, Role)
        VALUES (@Email, @Password, 'Driver');
        
        DECLARE @UserID INT = SCOPE_IDENTITY();
        
        -- Insert into Drivers table
        INSERT INTO Drivers (UserID, Name, PhoneNumber, LicenseNumber)
        VALUES (@UserID, @Name, @PhoneNumber, @LicenseNumber);
        
        -- Log the registration
        INSERT INTO SystemLogs (UserID, Action, Description)
        VALUES (@UserID, 'Registration', 'Driver registration completed');
        
        COMMIT TRANSACTION;
        
        -- Return the newly created DriverID
        SELECT D.DriverID FROM Drivers D WHERE D.UserID = @UserID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Create SP for vehicle registration
CREATE PROCEDURE sp_RegisterVehicle
    @DriverID INT,
    @Type NVARCHAR(50),
    @Make NVARCHAR(50),
    @Model NVARCHAR(50),
    @Year INT,
    @LicensePlate NVARCHAR(20),
    @Capacity INT,
    @PricePerDay DECIMAL(10, 2),
    @Features NVARCHAR(MAX) = NULL,
    @ImageURL NVARCHAR(MAX) = NULL
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if driver exists
        IF NOT EXISTS (SELECT 1 FROM Drivers WHERE DriverID = @DriverID)
        BEGIN
            RAISERROR('Driver does not exist', 16, 1);
            RETURN;
        END
        
        -- Check if license plate already exists
        IF EXISTS (SELECT 1 FROM Vehicles WHERE LicensePlate = @LicensePlate)
        BEGIN
            RAISERROR('Vehicle with this license plate already exists', 16, 1);
            RETURN;
        END
        
        -- Insert into Vehicles table
        INSERT INTO Vehicles (DriverID, Type, Make, Model, Year, LicensePlate, Capacity, PricePerDay, Features, ImageURL)
        VALUES (@DriverID, @Type, @Make, @Model, @Year, @LicensePlate, @Capacity, @PricePerDay, @Features, @ImageURL);
        
        -- Get the driver's UserID for logging
        DECLARE @UserID INT;
        SELECT @UserID = UserID FROM Drivers WHERE DriverID = @DriverID;
        
        -- Log the vehicle registration
        INSERT INTO SystemLogs (UserID, Action, Description)
        VALUES (@UserID, 'Vehicle Registration', 'New vehicle registered: ' + @Make + ' ' + @Model);
        
        COMMIT TRANSACTION;
        
        -- Return the newly created VehicleID
        SELECT SCOPE_IDENTITY() AS VehicleID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Create SP for booking creation
CREATE PROCEDURE sp_CreateBooking
    @TouristID INT,
    @DestinationID INT,
    @VehicleID INT,
    @TripDate DATE,
    @TripTime TIME,
    @NumTravelers INT,
    @SpecialRequests NVARCHAR(MAX) = NULL
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if tourist exists
        IF NOT EXISTS (SELECT 1 FROM Tourists WHERE TouristID = @TouristID)
        BEGIN
            RAISERROR('Tourist does not exist', 16, 1);
            RETURN;
        END
        
        -- Check if destination exists
        IF NOT EXISTS (SELECT 1 FROM Destinations WHERE DestinationID = @DestinationID)
        BEGIN
            RAISERROR('Destination does not exist', 16, 1);
            RETURN;
        END
        
        -- Check if vehicle exists and get driver ID
        DECLARE @DriverID INT;
        SELECT @DriverID = DriverID FROM Vehicles WHERE VehicleID = @VehicleID;
        
        IF @DriverID IS NULL
        BEGIN
            RAISERROR('Vehicle does not exist', 16, 1);
            RETURN;
        END
        
        -- Generate a unique booking number (format: BK + timestamp)
        DECLARE @BookingNumber NVARCHAR(20) = 'BK' + CAST(REPLACE(REPLACE(REPLACE(CONVERT(NVARCHAR, GETDATE(), 120), '-', ''), ':', ''), ' ', '') AS NVARCHAR);
        
        -- Create the booking
        INSERT INTO Bookings (BookingNumber, TouristID, DestinationID, VehicleID, DriverID, TripDate, TripTime, NumTravelers, SpecialRequests)
        VALUES (@BookingNumber, @TouristID, @DestinationID, @VehicleID, @DriverID, @TripDate, @TripTime, @NumTravelers, @SpecialRequests);
        
        DECLARE @BookingID INT = SCOPE_IDENTITY();
        
        -- Get the tourist's UserID for logging
        DECLARE @UserID INT;
        SELECT @UserID = UserID FROM Tourists WHERE TouristID = @TouristID;
        
        -- Log the booking creation
        INSERT INTO SystemLogs (UserID, Action, Description)
        VALUES (@UserID, 'Booking Creation', 'New booking created: ' + @BookingNumber);
        
        COMMIT TRANSACTION;
        
        -- Return booking information
        SELECT 
            B.BookingID,
            B.BookingNumber,
            B.TripDate,
            B.TripTime,
            D.Name AS DestinationName,
            D.Location AS DestinationLocation,
            V.Make AS VehicleMake,
            V.Model AS VehicleModel,
            V.Type AS VehicleType,
            DR.Name AS DriverName
        FROM Bookings B
        JOIN Destinations D ON B.DestinationID = D.DestinationID
        JOIN Vehicles V ON B.VehicleID = V.VehicleID
        JOIN Drivers DR ON B.DriverID = DR.DriverID
        WHERE B.BookingID = @BookingID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Create SP for payment processing
CREATE PROCEDURE sp_ProcessPayment
    @BookingID INT,
    @Amount DECIMAL(10, 2),
    @PaymentMethod NVARCHAR(50),
    @TransactionID NVARCHAR(100) = NULL
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if booking exists
        IF NOT EXISTS (SELECT 1 FROM Bookings WHERE BookingID = @BookingID)
        BEGIN
            RAISERROR('Booking does not exist', 16, 1);
            RETURN;
        END
        
        -- Check if payment already exists for this booking
        IF EXISTS (SELECT 1 FROM Payments WHERE BookingID = @BookingID)
        BEGIN
            RAISERROR('Payment already exists for this booking', 16, 1);
            RETURN;
        END
        
        -- Process the payment
        INSERT INTO Payments (BookingID, Amount, PaymentMethod, TransactionID, Status)
        VALUES (@BookingID, @Amount, @PaymentMethod, @TransactionID, 'Completed');
        
        -- Update booking status to Confirmed
        UPDATE Bookings
        SET Status = 'Confirmed'
        WHERE BookingID = @BookingID;
        
        -- Get booking information for logging
        DECLARE @BookingNumber NVARCHAR(20);
        DECLARE @UserID INT;
        
        SELECT 
            @BookingNumber = B.BookingNumber,
            @UserID = T.UserID
        FROM Bookings B
        JOIN Tourists T ON B.TouristID = T.TouristID
        WHERE B.BookingID = @BookingID;
        
        -- Log the payment
        INSERT INTO SystemLogs (UserID, Action, Description)
        VALUES (@UserID, 'Payment', 'Payment completed for booking: ' + @BookingNumber);
        
        COMMIT TRANSACTION;
        
        -- Return payment confirmation
        SELECT 
            P.PaymentID,
            B.BookingNumber,
            P.Amount,
            P.PaymentMethod,
            P.PaymentDate,
            P.Status
        FROM Payments P
        JOIN Bookings B ON P.BookingID = B.BookingID
        WHERE P.BookingID = @BookingID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Create SP for updating booking status
CREATE PROCEDURE sp_UpdateBookingStatus
    @BookingID INT,
    @Status NVARCHAR(20),
    @CancellationReason NVARCHAR(MAX) = NULL,
    @CancelledBy NVARCHAR(20) = NULL
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if booking exists
        IF NOT EXISTS (SELECT 1 FROM Bookings WHERE BookingID = @BookingID)
        BEGIN
            RAISERROR('Booking does not exist', 16, 1);
            RETURN;
        END
        
        -- Update booking status
        UPDATE Bookings
        SET 
            Status = @Status,
            CancellationReason = CASE WHEN @Status = 'Cancelled' THEN @CancellationReason ELSE CancellationReason END,
            CancelledBy = CASE WHEN @Status = 'Cancelled' THEN @CancelledBy ELSE CancelledBy END
        WHERE BookingID = @BookingID;
        
        -- Get booking information for logging
        DECLARE @BookingNumber NVARCHAR(20);
        DECLARE @UserID INT;
        
        SELECT 
            @BookingNumber = B.BookingNumber,
            @UserID = T.UserID
        FROM Bookings B
        JOIN Tourists T ON B.TouristID = T.TouristID
        WHERE B.BookingID = @BookingID;
        
        -- Log the status update
        INSERT INTO SystemLogs (UserID, Action, Description)
        VALUES (@UserID, 'Booking Status Update', 'Booking ' + @BookingNumber + ' status updated to: ' + @Status);
        
        -- If cancelled, check if payment exists and refund if necessary
        IF @Status = 'Cancelled'
        BEGIN
            UPDATE Payments
            SET Status = 'Refunded'
            WHERE BookingID = @BookingID AND Status = 'Completed';
            
            -- Log the refund if applicable
            IF @@ROWCOUNT > 0
            BEGIN
                INSERT INTO SystemLogs (UserID, Action, Description)
                VALUES (@UserID, 'Payment Refund', 'Payment refunded for cancelled booking: ' + @BookingNumber);
            END
        END
        
        COMMIT TRANSACTION;
        
        -- Return updated booking information
        SELECT 
            B.BookingID,
            B.BookingNumber,
            B.Status,
            B.CancellationReason,
            B.CancelledBy
        FROM Bookings B
        WHERE B.BookingID = @BookingID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Create SP for submitting reviews
CREATE PROCEDURE sp_SubmitReview
    @BookingID INT,
    @DriverRating INT,
    @VehicleRating INT,
    @OverallRating INT,
    @Comment NVARCHAR(MAX) = NULL
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if booking exists and get relevant IDs
        DECLARE @TouristID INT, @DriverID INT, @VehicleID INT;
        
        SELECT 
            @TouristID = B.TouristID,
            @DriverID = B.DriverID,
            @VehicleID = B.VehicleID
        FROM Bookings B
        WHERE B.BookingID = @BookingID;
        
        IF @TouristID IS NULL
        BEGIN
            RAISERROR('Booking does not exist', 16, 1);
            RETURN;
        END
        
        -- Check if the booking status is Completed
        DECLARE @Status NVARCHAR(20);
        SELECT @Status = Status FROM Bookings WHERE BookingID = @BookingID;
        
        IF @Status != 'Completed'
        BEGIN
            RAISERROR('Only completed bookings can be reviewed', 16, 1);
            RETURN;
        END
        
        -- Check if review already exists for this booking
        IF EXISTS (SELECT 1 FROM Reviews WHERE BookingID = @BookingID)
        BEGIN
            RAISERROR('Review already exists for this booking', 16, 1);
            RETURN;
        END
        
        -- Insert the review
        INSERT INTO Reviews (BookingID, TouristID, DriverID, VehicleID, DriverRating, VehicleRating, OverallRating, Comment)
        VALUES (@BookingID, @TouristID, @DriverID, @VehicleID, @DriverRating, @VehicleRating, @OverallRating, @Comment);
        
        -- Update driver's rating
        UPDATE Drivers
        SET 
            Rating = (SELECT AVG(DriverRating * 1.0) FROM Reviews WHERE DriverID = @DriverID),
            TotalTrips = (SELECT COUNT(1) FROM Bookings WHERE DriverID = @DriverID AND Status = 'Completed')
        WHERE DriverID = @DriverID;
        
        -- Get the tourist's UserID for logging
        DECLARE @UserID INT;
        SELECT @UserID = UserID FROM Tourists WHERE TouristID = @TouristID;
        
        -- Log the review submission
        INSERT INTO SystemLogs (UserID, Action, Description)
        VALUES (@UserID, 'Review Submission', 'Review submitted for booking ID: ' + CAST(@BookingID AS NVARCHAR));
        
        COMMIT TRANSACTION;
        
        -- Return confirmation
        SELECT 
            R.ReviewID,
            R.DriverRating,
            R.VehicleRating,
            R.OverallRating,
            R.ReviewDate
        FROM Reviews R
        WHERE R.BookingID = @BookingID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Create SP for getting tourist bookings
CREATE PROCEDURE sp_GetTouristBookings
    @TouristID INT,
    @Status NVARCHAR(20) = NULL
AS
BEGIN
    -- Check if tourist exists
    IF NOT EXISTS (SELECT 1 FROM Tourists WHERE TouristID = @TouristID)
    BEGIN
        RAISERROR('Tourist does not exist', 16, 1);
        RETURN;
    END
    
    -- Retrieve bookings with details
    SELECT 
        B.BookingID,
        B.BookingNumber,
        B.TripDate,
        B.TripTime,
        B.Status,
        B.NumTravelers,
        B.SpecialRequests,
        B.BookingDate,
        B.CancellationReason,
        D.Name AS DestinationName,
        D.Location AS DestinationLocation,
        D.ImageURL AS DestinationImageURL,
        V.Make AS VehicleMake,
        V.Model AS VehicleModel,
        V.Type AS VehicleType,
        V.Capacity AS VehicleCapacity,
        V.ImageURL AS VehicleImageURL,
        DR.Name AS DriverName,
        DR.Rating AS DriverRating,
        DR.TotalTrips AS DriverTotalTrips,
        P.Amount AS PaymentAmount,
        P.PaymentMethod,
        P.Status AS PaymentStatus,
        P.PaymentDate,
        CASE WHEN R.ReviewID IS NULL THEN 0 ELSE 1 END AS IsReviewed
    FROM Bookings B
    JOIN Destinations D ON B.DestinationID = D.DestinationID
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    JOIN Drivers DR ON B.DriverID = DR.DriverID
    LEFT JOIN Payments P ON B.BookingID = P.BookingID
    LEFT JOIN Reviews R ON B.BookingID = R.BookingID
    WHERE B.TouristID = @TouristID
    AND (@Status IS NULL OR B.Status = @Status)
    ORDER BY B.TripDate DESC, B.TripTime DESC;
END;
GO

-- Create SP for getting booking details
CREATE PROCEDURE sp_GetBookingDetails
    @BookingID INT
AS
BEGIN
    -- Check if booking exists
    IF NOT EXISTS (SELECT 1 FROM Bookings WHERE BookingID = @BookingID)
    BEGIN
        RAISERROR('Booking does not exist', 16, 1);
        RETURN;
    END
    
    -- Retrieve booking details
    SELECT 
        B.BookingID,
        B.BookingNumber,
        B.TripDate,
        B.TripTime,
        B.Status,
        B.NumTravelers,
        B.SpecialRequests,
        B.BookingDate,
        B.CancellationReason,
        B.CancelledBy,
        T.TouristID,
        T.Name AS TouristName,
        T.PhoneNumber AS TouristPhoneNumber,
        T.Country AS TouristCountry,
        D.DestinationID,
        D.Name AS DestinationName,
        D.Location AS DestinationLocation,
        D.Description AS DestinationDescription,
        D.ImageURL AS DestinationImageURL,
        V.VehicleID,
        V.Make AS VehicleMake,
        V.Model AS VehicleModel,
        V.Type AS VehicleType,
        V.Year AS VehicleYear,
        V.LicensePlate,
        V.Capacity AS VehicleCapacity,
        V.Features AS VehicleFeatures,
        V.ImageURL AS VehicleImageURL,
        DR.DriverID,
        DR.Name AS DriverName,
        DR.PhoneNumber AS DriverPhoneNumber,
        DR.Rating AS DriverRating,
        DR.TotalTrips AS DriverTotalTrips,
        P.PaymentID,
        P.Amount AS PaymentAmount,
        P.PaymentMethod,
        P.TransactionID,
        P.Status AS PaymentStatus,
        P.PaymentDate,
        R.ReviewID,
        R.DriverRating,
        R.VehicleRating,
        R.OverallRating,
        R.Comment AS ReviewComment,
        R.ReviewDate
    FROM Bookings B
    JOIN Tourists T ON B.TouristID = T.TouristID
    JOIN Destinations D ON B.DestinationID = D.DestinationID
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    JOIN Drivers DR ON B.DriverID = DR.DriverID
    LEFT JOIN Payments P ON B.BookingID = P.BookingID
    LEFT JOIN Reviews R ON B.BookingID = R.BookingID
    WHERE B.BookingID = @BookingID;
END;
GO

-- Create SP for checking if vehicle is available
CREATE PROCEDURE sp_CheckVehicleAvailability
    @VehicleID INT,
    @TripDate DATE,
    @TripTime TIME
AS
BEGIN
    -- Check if vehicle exists
    IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE VehicleID = @VehicleID)
    BEGIN
        RAISERROR('Vehicle does not exist', 16, 1);
        RETURN;
    END
    
    -- Check if vehicle is already booked for the given date and time
    DECLARE @IsAvailable BIT = 1;
    
    IF EXISTS (
        SELECT 1 
        FROM Bookings 
        WHERE VehicleID = @VehicleID 
        AND TripDate = @TripDate
        AND Status IN ('Pending', 'Confirmed')
    )
    BEGIN
        SET @IsAvailable = 0;
    END
    
    -- Return availability status
    SELECT @IsAvailable AS IsAvailable;
END;
GO

-- Create indices for performance
CREATE INDEX IX_Bookings_TouristID ON Bookings(TouristID);
CREATE INDEX IX_Bookings_DriverID ON Bookings(DriverID);
CREATE INDEX IX_Bookings_VehicleID ON Bookings(VehicleID);
CREATE INDEX IX_Bookings_Status ON Bookings(Status);