CREATE PROCEDURE sp_CreateReservation
    @user_id INT,
    @vehicle_id INT,
    @station_id INT,
    @start_time DATETIME,
    @end_time DATETIME
AS
BEGIN

    SET NOCOUNT ON;

    BEGIN TRY

        BEGIN TRANSACTION;

        -- Check that the user exists
        IF NOT EXISTS (
            SELECT 1
            FROM Users
            WHERE user_id = @user_id
        )
        BEGIN
            RAISERROR('User does not exist.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;


        -- Check that the vehicle belongs to the user
        IF NOT EXISTS (
            SELECT 1
            FROM Vehicles
            WHERE vehicle_id = @vehicle_id
              AND user_id = @user_id
        )
        BEGIN
            RAISERROR('Vehicle does not belong to this user.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;


        -- Find and lock an available charger
        DECLARE @charger_id INT;

        SELECT TOP 1
            @charger_id = charger_id
        FROM Chargers WITH (UPDLOCK, ROWLOCK)
        WHERE station_id = @station_id
          AND status = 'AVAILABLE'
        ORDER BY charger_id;


        -- No charger available
        IF @charger_id IS NULL
        BEGIN
            RAISERROR('No charger is currently available at this station.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;


        -- Create reservation
        INSERT INTO Reservations
        (
            user_id,
            vehicle_id,
            charger_id,
            reservation_time,
            start_time,
            end_time,
            status
        )
        VALUES
        (
            @user_id,
            @vehicle_id,
            @charger_id,
            GETDATE(),
            @start_time,
            @end_time,
            'CONFIRMED'
        );


        -- Update charger status
        UPDATE Chargers
        SET status = 'RESERVED'
        WHERE charger_id = @charger_id;


        COMMIT TRANSACTION;


        -- Return reservation details
        SELECT
            r.reservation_id,
            r.user_id,
            r.vehicle_id,
            r.charger_id,
            c.charger_type,
            r.start_time,
            r.end_time,
            r.status
        FROM Reservations r
        JOIN Chargers c
            ON r.charger_id = c.charger_id
        WHERE r.reservation_id = SCOPE_IDENTITY();

    END TRY

    BEGIN CATCH

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;

    END CATCH

END;
GO

DECLARE @start_time DATETIME;
DECLARE @end_time DATETIME;

SET @start_time = DATEADD(MINUTE, 30, GETDATE());
SET @end_time = DATEADD(MINUTE, 90, GETDATE());

EXEC sp_CreateReservation
    @user_id = 1,
    @vehicle_id = 1,
    @station_id = 1,
    @start_time = @start_time,
    @end_time = @end_time;