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
