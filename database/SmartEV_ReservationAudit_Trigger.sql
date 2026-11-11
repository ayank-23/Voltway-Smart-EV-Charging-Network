CREATE OR ALTER TRIGGER trg_Reservation_Audit
ON Reservations
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AuditLog
    (
        entity_name,
        entity_id,
        action,
        description
    )
    SELECT
        'Reservation',
        reservation_id,
        'RESERVATION_CREATED',
        CONCAT(
            'Reservation created for User ID ',
            user_id,
            ' using Charger ID ',
            charger_id
        )
    FROM inserted;
END;
GO