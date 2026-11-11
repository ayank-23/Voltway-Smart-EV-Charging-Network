/*
  Voltway feature update for SmartEVChargingNetwork.
  Run this script once in SQL Server Management Studio against SmartEVChargingNetwork.
  It updates reservation allocation to respect AC/DC selection and makes charging completion
  create a PENDING payment, while automatically assigning the freed charger to the oldest
  waiting driver at the same station.
*/
USE SmartEVChargingNetwork;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CreateReservation
    @user_id INT,
    @vehicle_id INT,
    @station_id INT,
    @start_time DATETIME,
    @end_time DATETIME,
    @charger_type VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE user_id = @user_id)
            THROW 51001, 'User does not exist.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.Vehicles WHERE vehicle_id = @vehicle_id AND user_id = @user_id)
            THROW 51002, 'Vehicle does not belong to this user.', 1;
        IF @charger_type IS NOT NULL AND @charger_type NOT IN ('AC','DC')
            THROW 51003, 'Charger type must be AC or DC.', 1;

        DECLARE @charger_id INT;
        SELECT TOP (1) @charger_id = charger_id
        FROM dbo.Chargers WITH (UPDLOCK, ROWLOCK)
        WHERE station_id = @station_id
          AND status = 'AVAILABLE'
          AND (@charger_type IS NULL OR charger_type = @charger_type)
        ORDER BY charger_id;
        IF @charger_id IS NULL
            THROW 51004, 'No available connector of the selected type at this station. Try another type or join the queue.', 1;

        INSERT INTO dbo.Reservations (user_id, vehicle_id, charger_id, reservation_time, start_time, end_time, status)
        VALUES (@user_id, @vehicle_id, @charger_id, GETDATE(), @start_time, @end_time, 'CONFIRMED');
        DECLARE @reservation_id INT = CONVERT(INT, SCOPE_IDENTITY());
        UPDATE dbo.Chargers SET status = 'RESERVED' WHERE charger_id = @charger_id;
        COMMIT TRANSACTION;
        SELECT r.reservation_id, r.user_id, r.vehicle_id, r.charger_id, c.charger_type, r.start_time, r.end_time, r.status
        FROM dbo.Reservations r JOIN dbo.Chargers c ON c.charger_id = r.charger_id
        WHERE r.reservation_id = @reservation_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EndCharging
    @session_id INT,
    @energy_consumed DECIMAL(8,2)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @reservation_id INT, @charger_id INT, @station_id INT, @charger_type VARCHAR(20);
        DECLARE @rate DECIMAL(10,2), @total_amount DECIMAL(10,2), @current_hour INT;
        SELECT @reservation_id = cs.reservation_id, @charger_id = r.charger_id
        FROM dbo.ChargingSessions cs WITH (UPDLOCK, ROWLOCK)
        JOIN dbo.Reservations r ON r.reservation_id = cs.reservation_id
        WHERE cs.session_id = @session_id AND cs.status = 'ACTIVE';
        IF @reservation_id IS NULL THROW 51010, 'Active charging session does not exist.', 1;
        IF @energy_consumed <= 0 THROW 51011, 'Energy consumed must be greater than zero.', 1;

        SELECT @station_id = station_id, @charger_type = charger_type FROM dbo.Chargers WHERE charger_id = @charger_id;
        SET @current_hour = DATEPART(HOUR, GETDATE());
        IF @current_hour BETWEEN 8 AND 11 OR @current_hour BETWEEN 17 AND 21
            SELECT TOP (1) @rate = peak_rate FROM dbo.Pricing WHERE station_id = @station_id AND charger_type = @charger_type ORDER BY pricing_id DESC;
        ELSE
            SELECT TOP (1) @rate = off_peak_rate FROM dbo.Pricing WHERE station_id = @station_id AND charger_type = @charger_type ORDER BY pricing_id DESC;
        IF @rate IS NULL THROW 51012, 'Pricing information not found for this connector.', 1;
        SET @total_amount = @energy_consumed * @rate;

        UPDATE dbo.ChargingSessions SET end_time = GETDATE(), energy_consumed = @energy_consumed,
            total_amount = @total_amount, status = 'COMPLETED' WHERE session_id = @session_id;
        UPDATE dbo.Reservations SET status = 'COMPLETED' WHERE reservation_id = @reservation_id;
        UPDATE dbo.Chargers SET status = 'AVAILABLE' WHERE charger_id = @charger_id;

        INSERT INTO dbo.Payments (session_id, amount, payment_method, payment_status, payment_time)
        VALUES (@session_id, @total_amount, 'UPI', 'PENDING', NULL);
        DECLARE @payment_id INT = CONVERT(INT, SCOPE_IDENTITY());

        INSERT INTO dbo.AuditLog (entity_name, entity_id, action, description)
        VALUES ('ChargingSession', @session_id, 'SESSION_COMPLETED',
            CONCAT('Charging ended. Energy consumed: ', @energy_consumed, ' kWh. Amount due: ₹', @total_amount, '. Payment pending.'));

        /* FIFO auto-assignment: reserve the freed connector for the oldest waiting driver at this station. */
        DECLARE @queue_id INT, @queue_user_id INT, @queue_vehicle_id INT, @new_reservation_id INT;
        SELECT TOP (1) @queue_id = queue_id, @queue_user_id = user_id, @queue_vehicle_id = vehicle_id
        FROM dbo.ChargingQueue WITH (UPDLOCK, ROWLOCK)
        WHERE station_id = @station_id AND queue_status = 'WAITING'
        ORDER BY request_time, queue_id;

        IF @queue_id IS NOT NULL
        BEGIN
            INSERT INTO dbo.Reservations (user_id, vehicle_id, charger_id, reservation_time, start_time, end_time, status)
            VALUES (@queue_user_id, @queue_vehicle_id, @charger_id, GETDATE(), GETDATE(), DATEADD(MINUTE, 60, GETDATE()), 'CONFIRMED');
            SET @new_reservation_id = CONVERT(INT, SCOPE_IDENTITY());
            UPDATE dbo.Chargers SET status = 'RESERVED' WHERE charger_id = @charger_id;
            UPDATE dbo.ChargingQueue SET queue_status = 'ASSIGNED' WHERE queue_id = @queue_id;
            INSERT INTO dbo.AuditLog (entity_name, entity_id, action, description)
            VALUES ('Reservation', @new_reservation_id, 'QUEUE_AUTO_ASSIGNED',
                CONCAT('Queue #', @queue_id, ' automatically assigned to connector #', @charger_id, '.'));
            IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                INSERT INTO dbo.Notifications (user_id, message, notification_time, is_read)
                VALUES (@queue_user_id, CONCAT('A connector is available. Your reservation #', @new_reservation_id, ' is confirmed.'), GETDATE(), 0);
        END;

        COMMIT TRANSACTION;
        SELECT cs.session_id, cs.reservation_id, cs.energy_consumed, @rate AS rate_per_kwh,
            cs.total_amount, cs.status AS session_status, p.payment_id, p.payment_method,
            p.payment_status, @new_reservation_id AS queue_assigned_reservation_id
        FROM dbo.ChargingSessions cs JOIN dbo.Payments p ON p.session_id = cs.session_id
        WHERE cs.session_id = @session_id AND p.payment_id = @payment_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
