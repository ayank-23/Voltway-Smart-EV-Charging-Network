-- ============================================
-- 1. USERS
-- ============================================

INSERT INTO Users (full_name, email, phone)
VALUES
('Ayan Khan', 'ayan@gmail.com', '9876543210'),
('Rahul Sharma', 'rahul@gmail.com', '9876543211'),
('Priya Nair', 'priya@gmail.com', '9876543212'),
('Arjun Mehta', 'arjun@gmail.com', '9876543213'),
('Sneha Kapoor', 'sneha@gmail.com', '9876543214');
GO

-- ============================================
-- 2. VEHICLES
-- ============================================

INSERT INTO Vehicles
(user_id, vehicle_number, vehicle_model, battery_capacity)
VALUES
(1, 'TN01EV1001', 'Tata Nexon EV', 40.50),
(2, 'TN02EV1002', 'MG ZS EV', 50.30),
(3, 'TN03EV1003', 'Hyundai Ioniq 5', 72.60),
(4, 'TN04EV1004', 'Tata Punch EV', 35.00),
(5, 'TN05EV1005', 'Mahindra XUV400 EV', 39.40);
GO

-- ============================================
-- 3. STATIONS
-- ============================================

INSERT INTO Stations
(station_name, location, total_chargers)
VALUES
('SRM Charging Hub', 'Kattankulathur', 4),
('Chennai Central EV Station', 'Chennai Central', 3),
('OMR Green Charge', 'Old Mahabalipuram Road', 4);
GO

-- ============================================
-- 4. CHARGERS
-- ============================================

INSERT INTO Chargers
(station_id, charger_type, power_rating, status)
VALUES
-- SRM Charging Hub
(1, 'AC', 22.00, 'AVAILABLE'),
(1, 'DC', 60.00, 'AVAILABLE'),
(1, 'DC', 120.00, 'AVAILABLE'),
(1, 'AC', 22.00, 'MAINTENANCE'),

-- Chennai Central
(2, 'DC', 60.00, 'AVAILABLE'),
(2, 'AC', 22.00, 'RESERVED'),
(2, 'DC', 120.00, 'AVAILABLE'),

-- OMR
(3, 'AC', 22.00, 'AVAILABLE'),
(3, 'DC', 60.00, 'AVAILABLE'),
(3, 'DC', 120.00, 'CHARGING'),
(3, 'AC', 22.00, 'AVAILABLE');
GO

-- ============================================
-- 5. PRICING
-- ============================================

INSERT INTO Pricing
(station_id, charger_type, peak_rate, off_peak_rate)
VALUES
(1, 'AC', 12.00, 8.00),
(1, 'DC', 18.00, 12.00),
(2, 'AC', 14.00, 9.00),
(2, 'DC', 20.00, 14.00),
(3, 'AC', 13.00, 8.50),
(3, 'DC', 19.00, 13.00);
GO