EXEC sp_StartCharging
    @reservation_id = 3;

SELECT *
FROM Chargers;

EXEC sp_EndCharging
    @session_id = 2,
    @energy_consumed = 20;

SELECT *
FROM vw_ChargingPaymentReport;