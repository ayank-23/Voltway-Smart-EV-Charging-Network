CREATE VIEW vw_AvailableChargers
AS
SELECT
    c.charger_id,
    s.station_id,
    s.station_name,
    s.location,
    c.charger_type,
    c.power_rating,
    c.status
FROM Chargers c
INNER JOIN Stations s
    ON c.station_id = s.station_id
WHERE c.status = 'AVAILABLE';
GO

SELECT *
FROM vw_AvailableChargers;