CREATE VIEW vw_StationUtilization
AS
SELECT
    s.station_id,
    s.station_name,
    COUNT(c.charger_id) AS total_chargers,

    SUM(
        CASE
            WHEN c.status = 'AVAILABLE' THEN 1
            ELSE 0
        END
    ) AS available_chargers,

    SUM(
        CASE
            WHEN c.status = 'RESERVED' THEN 1
            ELSE 0
        END
    ) AS reserved_chargers,

    SUM(
        CASE
            WHEN c.status = 'CHARGING' THEN 1
            ELSE 0
        END
    ) AS charging_chargers,

    SUM(
        CASE
            WHEN c.status = 'MAINTENANCE' THEN 1
            ELSE 0
        END
    ) AS maintenance_chargers

FROM Stations s
LEFT JOIN Chargers c
    ON s.station_id = c.station_id
GROUP BY
    s.station_id,
    s.station_name;
GO

SELECT *
FROM vw_StationUtilization;


-- Window function for utilization rank
SELECT
    station_id,
    station_name,
    total_chargers,
    available_chargers,
    reserved_chargers,
    charging_chargers,
    (
        reserved_chargers + charging_chargers
    ) AS occupied_chargers,

    RANK() OVER
    (
        ORDER BY
        (
            reserved_chargers + charging_chargers
        ) DESC
    ) AS utilization_rank

FROM vw_StationUtilization;