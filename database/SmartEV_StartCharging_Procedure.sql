CREATE PROCEDURE sp_StartCharging
    @reservation_id INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY

        BEGIN TRANSACTION;

        DECLARE @charger_id INT;
        DECLARE @reservation_status VARCHAR(20);

        -- Get reservation details
        SELECT
            @charger_id = charger_id,
            @reservation_status = status
        FROM Reservations
        WHERE reservation_id = @reservation_id;

        -- Check reservation exists
        IF @charger_id IS NULL
        BEGIN
            RAISERROR('Reservation does not exist.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Check reservation status
        IF @reservation_status <> 'CONFIRMED'
        BEGIN
            RAISERROR('Reservation is not available for charging.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Update charger status
        UPDATE Chargers
        SET status = 'CHARGING'
        WHERE charger_id = @charger_id;

        -- Create charging session
        INSERT INTO ChargingSessions
        (
            reservation_id,
            start_time,
            status
        )
        VALUES
        (
            @reservation_id,
            GETDATE(),
            'ACTIVE'
        );

        COMMIT TRANSACTION;

        -- Show session
        SELECT
            session_id,
            reservation_id,
            start_time,
            status
        FROM ChargingSessions
        WHERE session_id = SCOPE_IDENTITY();

    END TRY

    BEGIN CATCH

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;

    END CATCH
END;
GO

EXEC sp_StartCharging
    @reservation_id = 1;

SELECT *
FROM Chargers
WHERE charger_id = 1;