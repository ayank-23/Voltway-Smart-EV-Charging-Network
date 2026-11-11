CREATE VIEW vw_ChargingPaymentReport
AS
SELECT
    cs.session_id,
    r.reservation_id,
    u.full_name,
    v.vehicle_number,
    s.station_name,
    c.charger_type,
    cs.start_time,
    cs.end_time,
    cs.energy_consumed,
    cs.total_amount,
    cs.status AS session_status,
    p.payment_method,
    p.payment_status,
    p.payment_time
FROM ChargingSessions cs
INNER JOIN Reservations r
    ON cs.reservation_id = r.reservation_id
INNER JOIN Users u
    ON r.user_id = u.user_id
INNER JOIN Vehicles v
    ON r.vehicle_id = v.vehicle_id
INNER JOIN Chargers c
    ON r.charger_id = c.charger_id
INNER JOIN Stations s
    ON c.station_id = s.station_id
LEFT JOIN Payments p
    ON cs.session_id = p.session_id;
GO

SELECT *
FROM vw_ChargingPaymentReport;