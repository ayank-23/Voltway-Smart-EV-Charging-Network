CREATE PROCEDURE sp_AddToChargingQueue
    @user_id INT,
    @vehicle_id INT,
    @station_id INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY

        BEGIN TRANSACTION;

        -- Check user and vehicle
        IF NOT EXISTS
        (
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

        -- Check if charger is available
        IF EXISTS
        (
            SELECT 1
            FROM Chargers
            WHERE station_id = @station_id
              AND status = 'AVAILABLE'
        )
        BEGIN
            RAISERROR(
                'A charger is currently available. Please make a reservation instead.',
                16,
                1
            );
            ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Add user to queue
        INSERT INTO ChargingQueue
        (
            user_id,
            station_id,
            vehicle_id,
            request_time,
            queue_status
        )
        VALUES
        (
            @user_id,
            @station_id,
            @vehicle_id,
            GETDATE(),
            'WAITING'
        );

        COMMIT TRANSACTION;

        -- Show queue position
        SELECT
            queue_id,
            user_id,
            station_id,
            vehicle_id,
            request_time,
            queue_status,
            ROW_NUMBER() OVER (
                ORDER BY request_time
            ) AS queue_position
        FROM ChargingQueue
        WHERE station_id = @station_id
          AND queue_status = 'WAITING'
        ORDER BY request_time;

    END TRY

    BEGIN CATCH

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;

    END CATCH
END;
GO

UPDATE Chargers
SET status = 'CHARGING'
WHERE station_id = 2;
GO

SELECT *
FROM Chargers
WHERE station_id = 2;

EXEC sp_AddToChargingQueue
    @user_id = 2,
    @vehicle_id = 2,
    @station_id = 2;

EXEC sp_AddToChargingQueue
    @user_id = 3,
    @vehicle_id = 3,
    @station_id = 2;


SELECT
queue_id,
user_id,
vehicle_id,
request_time,
queue_status,
ROW_NUMBER() OVER (
  ORDER BY request_time
   ) AS queue_position
FROM ChargingQueue
WHERE station_id = 2
  AND queue_status = 'WAITING'
ORDER BY request_time;
