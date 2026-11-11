SELECT * FROM vw_AvailableChargers;

DECLARE @start_time DATETIME;
DECLARE @end_time DATETIME;

SET @start_time = DATEADD(MINUTE, 30, GETDATE());
SET @end_time = DATEADD(MINUTE, 90, GETDATE());

EXEC sp_CreateReservation
    @user_id = 4,
    @vehicle_id = 4,
    @station_id = 1,
    @start_time = @start_time,
    @end_time = @end_time;

SELECT * FROM vw_ReservationHistory;

SELECT * FROM AuditLog
ORDER BY action_time DESC;