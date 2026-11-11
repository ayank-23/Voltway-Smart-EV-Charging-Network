-- ============================================
-- 1. USERS
-- ============================================
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- ============================================
-- 2. VEHICLES
-- ============================================
CREATE TABLE Vehicles (
    vehicle_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    vehicle_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_model VARCHAR(100) NOT NULL,
    battery_capacity DECIMAL(6,2) NOT NULL,
    
    CONSTRAINT FK_Vehicles_Users
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
);
GO

-- ============================================
-- 3. STATIONS
-- ============================================
CREATE TABLE Stations (
    station_id INT IDENTITY(1,1) PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    total_chargers INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- ============================================
-- 4. CHARGERS
-- ============================================
CREATE TABLE Chargers (
    charger_id INT IDENTITY(1,1) PRIMARY KEY,
    station_id INT NOT NULL,
    charger_type VARCHAR(20) NOT NULL,
    power_rating DECIMAL(6,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT FK_Chargers_Stations
        FOREIGN KEY (station_id)
        REFERENCES Stations(station_id),

    CONSTRAINT CHK_Charger_Type
        CHECK (charger_type IN ('AC', 'DC')),

    CONSTRAINT CHK_Charger_Status
        CHECK (status IN ('AVAILABLE', 'RESERVED', 'CHARGING', 'MAINTENANCE'))
);
GO

-- ============================================
-- 5. RESERVATIONS
-- ============================================
CREATE TABLE Reservations (
    reservation_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    charger_id INT NOT NULL,
    reservation_time DATETIME NOT NULL DEFAULT GETDATE(),
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',

    CONSTRAINT FK_Reservations_Users
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id),

    CONSTRAINT FK_Reservations_Vehicles
        FOREIGN KEY (vehicle_id)
        REFERENCES Vehicles(vehicle_id),

    CONSTRAINT FK_Reservations_Chargers
        FOREIGN KEY (charger_id)
        REFERENCES Chargers(charger_id),

    CONSTRAINT CHK_Reservation_Status
        CHECK (status IN ('CONFIRMED', 'COMPLETED', 'CANCELLED'))
);
GO

-- ============================================
-- 6. CHARGING SESSIONS
-- ============================================
CREATE TABLE ChargingSessions (
    session_id INT IDENTITY(1,1) PRIMARY KEY,
    reservation_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    energy_consumed DECIMAL(8,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT FK_Sessions_Reservations
        FOREIGN KEY (reservation_id)
        REFERENCES Reservations(reservation_id),

    CONSTRAINT CHK_Session_Status
        CHECK (status IN ('ACTIVE', 'COMPLETED'))
);
GO

-- ============================================
-- 7. PAYMENTS
-- ============================================
CREATE TABLE Payments (
    payment_id INT IDENTITY(1,1) PRIMARY KEY,
    session_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_time DATETIME NULL,

    CONSTRAINT FK_Payments_Sessions
        FOREIGN KEY (session_id)
        REFERENCES ChargingSessions(session_id),

    CONSTRAINT CHK_Payment_Status
        CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED'))
);
GO

-- ============================================
-- 8. QUEUE
-- ============================================
CREATE TABLE ChargingQueue (
    queue_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    station_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    request_time DATETIME DEFAULT GETDATE(),
    queue_status VARCHAR(20) DEFAULT 'WAITING',

    CONSTRAINT FK_Queue_Users
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id),

    CONSTRAINT FK_Queue_Stations
        FOREIGN KEY (station_id)
        REFERENCES Stations(station_id),

    CONSTRAINT FK_Queue_Vehicles
        FOREIGN KEY (vehicle_id)
        REFERENCES Vehicles(vehicle_id),

    CONSTRAINT CHK_Queue_Status
        CHECK (queue_status IN ('WAITING', 'ASSIGNED', 'CANCELLED'))
);
GO

-- ============================================
-- 9. PRICING
-- ============================================
CREATE TABLE Pricing (
    pricing_id INT IDENTITY(1,1) PRIMARY KEY,
    station_id INT NOT NULL,
    charger_type VARCHAR(20) NOT NULL,
    peak_rate DECIMAL(10,2) NOT NULL,
    off_peak_rate DECIMAL(10,2) NOT NULL,
    effective_from DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Pricing_Stations
        FOREIGN KEY (station_id)
        REFERENCES Stations(station_id)
);
GO

-- ============================================
-- 10. NOTIFICATIONS
-- ============================================
CREATE TABLE Notifications (
    notification_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    message VARCHAR(500) NOT NULL,
    notification_time DATETIME DEFAULT GETDATE(),
    is_read BIT DEFAULT 0,

    CONSTRAINT FK_Notifications_Users
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
);
GO


-- ============================================
-- 11. AUDIT LOG
-- ============================================
CREATE TABLE AuditLog (
    log_id INT IDENTITY(1,1) PRIMARY KEY,
    entity_name VARCHAR(100) NOT NULL,
    entity_id INT,
    action VARCHAR(100) NOT NULL,
    action_time DATETIME DEFAULT GETDATE(),
    description VARCHAR(500)
);
GO