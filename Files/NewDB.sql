-- Create the database
CREATE DATABASE TripBookingSystem;
GO
USE TripBookingSystem;
GO

-- USERS TABLE
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    phone NVARCHAR(15),
    role VARCHAR(10) NOT NULL CHECK (role IN ('traveler', 'driver', 'admin')),
    profile_photo NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE()
);

-- EMAIL VERIFICATION TABLE
CREATE TABLE EmailVerification (
    verification_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    verification_token NVARCHAR(255),
    expiration DATETIME,
    is_verified BIT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- TOURISTS TABLE
CREATE TABLE Tourists (
    tourist_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    phone_number NVARCHAR(20),
    country NVARCHAR(100),
    date_of_birth DATE,
    gender NVARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
    preferred_language NVARCHAR(50) DEFAULT 'English',
    emergency_contact_name NVARCHAR(100),
    emergency_contact_phone NVARCHAR(20),
    profile_picture NVARCHAR(MAX),
    travel_preferences NVARCHAR(MAX),
    registration_date DATETIME DEFAULT GETDATE(),
    updated_at DATETIME NULL,
    status NVARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Banned')),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- DRIVERS TABLE
CREATE TABLE Drivers (
    driver_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    phone_number NVARCHAR(20) NOT NULL,
    gender NVARCHAR(10),
    date_of_birth DATE,
    nic_number NVARCHAR(20) NOT NULL,
    nic_front_image NVARCHAR(MAX) NOT NULL,
    nic_back_image NVARCHAR(MAX) NOT NULL,
    profile_picture NVARCHAR(MAX),
    license_number NVARCHAR(50) NOT NULL,
    license_front_image NVARCHAR(MAX) NOT NULL,
    license_expiry_date DATE NOT NULL,
    police_clearance_image NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Blocked')),
    registration_date DATETIME DEFAULT GETDATE(),
    updated_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- VEHICLES TABLE
CREATE TABLE Vehicles (
    vehicle_id INT IDENTITY(1,1) PRIMARY KEY,
    driver_id INT NOT NULL,
    vehicle_type NVARCHAR(10) CHECK (vehicle_type IN ('car', 'van', 'suv', 'tuk')),
    make_model NVARCHAR(100),
    registration_number NVARCHAR(50) NOT NULL,
    vehicle_photo NVARCHAR(MAX),
    insurance_expiry_date DATE NOT NULL,
    seat_count INT,
    air_conditioned BIT DEFAULT 1,
    verified BIT DEFAULT 0,
    FOREIGN KEY (driver_id) REFERENCES Drivers(driver_id) ON DELETE CASCADE
);

-- DRIVER AVAILABILITY
CREATE TABLE DriverAvailability (
    availability_id INT IDENTITY(1,1) PRIMARY KEY,
    driver_id INT,
    available_date DATE,
    is_available BIT DEFAULT 1,
    FOREIGN KEY (driver_id) REFERENCES Drivers(driver_id) ON DELETE CASCADE
);

-- DESTINATIONS TABLE
CREATE TABLE Destinations (
    destination_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    province NVARCHAR(50),
    region NVARCHAR(50),
    description TEXT
);

-- DISTANCE MATRIX
CREATE TABLE Distances (
    from_id INT,
    to_id INT,
    distance_km FLOAT NOT NULL,
    duration_hours FLOAT NOT NULL,
    PRIMARY KEY (from_id, to_id),
    FOREIGN KEY (from_id) REFERENCES Destinations(destination_id),
    FOREIGN KEY (to_id) REFERENCES Destinations(destination_id)
);

-- TRIPS
CREATE TABLE Trips (
    trip_id INT IDENTITY(1,1) PRIMARY KEY,
    traveler_id INT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_distance FLOAT,
    total_days INT,
    estimated_cost FLOAT,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (traveler_id) REFERENCES Users(user_id)
);

-- TRIP STOPS
CREATE TABLE TripStops (
    stop_id INT IDENTITY(1,1) PRIMARY KEY,
    trip_id INT,
    destination_id INT,
    stop_order INT,
    trip_day INT,
    overnight_stay BIT DEFAULT 0,
    stop_notes TEXT,
    FOREIGN KEY (trip_id) REFERENCES Trips(trip_id),
    FOREIGN KEY (destination_id) REFERENCES Destinations(destination_id)
);

-- TRIP PREFERENCES
CREATE TABLE TripPreferences (
    preference_id INT IDENTITY(1,1) PRIMARY KEY,
    trip_id INT,
    vehicle_type NVARCHAR(10) CHECK (vehicle_type IN ('car', 'van', 'suv')),
    budget_range NVARCHAR(10) CHECK (budget_range IN ('low', 'medium', 'luxury')),
    need_guide BIT DEFAULT 0,
    need_accommodation_help BIT DEFAULT 0,
    special_requests TEXT,
    FOREIGN KEY (trip_id) REFERENCES Trips(trip_id)
);

-- BOOKINGS
CREATE TABLE Bookings (
    booking_id INT IDENTITY(1,1) PRIMARY KEY,
    trip_id INT,
    driver_id INT,
    vehicle_id INT,
    status NVARCHAR(15) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed')),
    fare FLOAT,
    payment_status NVARCHAR(15) DEFAULT 'not_paid' CHECK (payment_status IN ('not_paid', 'paid', 'partial')),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (trip_id) REFERENCES Trips(trip_id),
    FOREIGN KEY (driver_id) REFERENCES Users(user_id),
    FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id)
);

-- REVIEWS
CREATE TABLE TripReviews (
    review_id INT IDENTITY(1,1) PRIMARY KEY,
    trip_id INT,
    traveler_id INT,
    driver_id INT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (trip_id) REFERENCES Trips(trip_id),
    FOREIGN KEY (traveler_id) REFERENCES Users(user_id),
    FOREIGN KEY (driver_id) REFERENCES Users(user_id)
);
