CREATE PROCEDURE sp_EndCharging
    @session_id INT,
    @energy_consumed DECIMAL(8,2)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY

        BEGIN TRANSACTION;

        DECLARE @reservation_id INT;
        DECLARE @charger_id INT;
        DECLARE @station_id INT;
        DECLARE @charger_type VARCHAR(20);

        DECLARE @rate DECIMAL(10,2);
        DECLARE @total_amount DECIMAL(10,2);

        DECLARE @current_hour INT;


        -- ==========================================
        -- Get session and charger information
        -- ==========================================

        SELECT
            @reservation_id = cs.reservation_id,
            @charger_id = r.charger_id
        FROM ChargingSessions cs
        INNER JOIN Reservations r
            ON cs.reservation_id = r.reservation_id
        WHERE cs.session_id = @session_id
          AND cs.status = 'ACTIVE';


        -- Check session
        IF @reservation_id IS NULL
        BEGIN
            RAISERROR('Active charging session does not exist.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;


        -- Get station and charger type
        SELECT
            @station_id = station_id,
            @charger_type = charger_type
        FROM Chargers
        WHERE charger_id = @charger_id;


        -- ==========================================
        -- Determine peak / off-peak period
        -- ==========================================

        SET @current_hour = DATEPART(HOUR, GETDATE());


        IF @current_hour BETWEEN 8 AND 11
           OR @current_hour BETWEEN 17 AND 21
        BEGIN

            SELECT TOP 1
                @rate = peak_rate
            FROM Pricing
            WHERE station_id = @station_id
              AND charger_type = @charger_type
            ORDER BY pricing_id DESC;

        END
        ELSE
        BEGIN

            SELECT TOP 1
                @rate = off_peak_rate
            FROM Pricing
            WHERE station_id = @station_id
              AND charger_type = @charger_type
            ORDER BY pricing_id DESC;

        END;


        -- Check pricing exists
        IF @rate IS NULL
        BEGIN
            RAISERROR('Pricing information not found.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END;


        -- ==========================================
        -- Calculate total amount
        -- ==========================================

        SET @total_amount = @energy_consumed * @rate;


        -- ==========================================
        -- Complete charging session
        -- ==========================================

        UPDATE ChargingSessions
        SET
            end_time = GETDATE(),
            energy_consumed = @energy_consumed,
            total_amount = @total_amount,
            status = 'COMPLETED'
        WHERE session_id = @session_id;


        -- ==========================================
        -- Make charger available
        -- ==========================================

        UPDATE Chargers
        SET status = 'AVAILABLE'
        WHERE charger_id = @charger_id;


        -- ==========================================
        -- Complete reservation
        -- ==========================================

        UPDATE Reservations
        SET status = 'COMPLETED'
        WHERE reservation_id = @reservation_id;


        -- ==========================================
        -- Create payment
        -- ==========================================

        INSERT INTO Payments
        (
            session_id,
            amount,
            payment_method,
            payment_status,
            payment_time
        )
        VALUES
        (
            @session_id,
            @total_amount,
            'UPI',
            'SUCCESS',
            GETDATE()
        );


        -- ==========================================
        -- Create audit log
        -- ==========================================

        INSERT INTO AuditLog
        (
            entity_name,
            entity_id,
            action,
            description
        )
        VALUES
        (
            'ChargingSession',
            @session_id,
            'SESSION_COMPLETED',
            CONCAT(
                'Charging completed. Energy consumed: ',
                @energy_consumed,
                ' kWh. Amount: ₹',
                @total_amount
            )
        );


        COMMIT TRANSACTION;


        -- ==========================================
        -- Display final result
        -- ==========================================

        SELECT
            cs.session_id,
            cs.reservation_id,
            cs.energy_consumed,
            @rate AS rate_per_kwh,
            cs.total_amount,
            cs.status AS session_status,
            p.payment_id,
            p.payment_method,
            p.payment_status
        FROM ChargingSessions cs
        INNER JOIN Payments p
            ON cs.session_id = p.session_id
        WHERE cs.session_id = @session_id;


    END TRY

    BEGIN CATCH

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;

    END CATCH

END;
GO

EXEC sp_EndCharging
    @session_id = 1,
    @energy_consumed = 20;

SELECT *
FROM Chargers
WHERE charger_id = 1;

SELECT *
FROM ChargingSessions;

SELECT *
FROM Payments;

SELECT *
FROM AuditLog
ORDER BY log_id;