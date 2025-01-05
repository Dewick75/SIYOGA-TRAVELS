-- Add UpdatedAt column to Users table
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE Name = 'UpdatedAt'
    AND Object_ID = Object_ID('Users')
)
BEGIN
    ALTER TABLE Users
    ADD UpdatedAt DATETIME NULL;
    
    -- Update existing records to have current date
    UPDATE Users
    SET UpdatedAt = GETDATE()
    WHERE UpdatedAt IS NULL;
    
    -- Add trigger to update the UpdatedAt field
    IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Users_UpdatedAt')
    BEGIN
        DROP TRIGGER trg_Users_UpdatedAt;
    END
    
    EXEC('
    CREATE TRIGGER trg_Users_UpdatedAt
    ON Users
    AFTER UPDATE
    AS
    BEGIN
        UPDATE Users
        SET UpdatedAt = GETDATE()
        FROM Users u
        INNER JOIN inserted i ON u.UserID = i.UserID
    END
    ');
    
    PRINT 'UpdatedAt column added to Users table with trigger';
END
ELSE
BEGIN
    PRINT 'UpdatedAt column already exists in Users table';
END
