CREATE VIEW vw_ReservationHistory
AS
SELECT
    r.reservation_id,
    u.full_name,
    v.vehicle_number,
    v.vehicle_model,
    s.station_name,
    c.charger_id,
    c.charger_type,
    r.start_time,
    r.end_time,
    r.status
FROM Reservations r
INNER JOIN Users u
    ON r.user_id = u.user_id
INNER JOIN Vehicles v
    ON r.vehicle_id = v.vehicle_id
INNER JOIN Chargers c
    ON r.charger_id = c.charger_id
INNER JOIN Stations s
    ON c.station_id = s.station_id;
GO

SELECT *
FROM vw_ReservationHistory;