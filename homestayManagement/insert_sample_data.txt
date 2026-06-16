-- Sample data for schema described in database.md
-- Database: MySQL 8
-- Login password for all sample accounts: 123456
-- Note: accounts has 10 rows because customers and employees both need 5 one-to-one accounts.

SET @sample_password = '$2y$10$EvH9B1Gbc3TeokB1KdBCk.2YER5zQS7tRJjrGuCo3pk/JN0v2Lwim';
SET @today = CURDATE();
SET @yesterday = DATE_SUB(@today, INTERVAL 1 DAY);
SET @tomorrow = DATE_ADD(@today, INTERVAL 1 DAY);
SET @next_day = DATE_ADD(@today, INTERVAL 2 DAY);

SET @yesterday_0800 = TIMESTAMP(@yesterday, '08:00:00');
SET @yesterday_0900 = TIMESTAMP(@yesterday, '09:00:00');
SET @yesterday_1000 = TIMESTAMP(@yesterday, '10:00:00');
SET @today_0800 = TIMESTAMP(@today, '08:00:00');
SET @today_0900 = TIMESTAMP(@today, '09:00:00');
SET @today_1000 = TIMESTAMP(@today, '10:00:00');
SET @today_1100 = TIMESTAMP(@today, '11:00:00');
SET @today_1200 = TIMESTAMP(@today, '12:00:00');
SET @today_1300 = TIMESTAMP(@today, '13:00:00');
SET @today_1400 = TIMESTAMP(@today, '14:00:00');
SET @today_1500 = TIMESTAMP(@today, '15:00:00');
SET @today_1600 = TIMESTAMP(@today, '16:00:00');
SET @today_1700 = TIMESTAMP(@today, '17:00:00');
SET @today_1800 = TIMESTAMP(@today, '18:00:00');
SET @today_1900 = TIMESTAMP(@today, '19:00:00');
SET @today_2000 = TIMESTAMP(@today, '20:00:00');
SET @tomorrow_0900 = TIMESTAMP(@tomorrow, '09:00:00');
SET @tomorrow_1100 = TIMESTAMP(@tomorrow, '11:00:00');
SET @tomorrow_1200 = TIMESTAMP(@tomorrow, '12:00:00');
SET @tomorrow_1400 = TIMESTAMP(@tomorrow, '14:00:00');
SET @next_day_1100 = TIMESTAMP(@next_day, '11:00:00');

-- ============================================================
-- 0. Schema preparation for the new room-type booking model
-- ============================================================
DROP PROCEDURE IF EXISTS prepare_room_type_booking_schema;
DELIMITER //
CREATE PROCEDURE prepare_room_type_booking_schema()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'booking_details'
          AND COLUMN_NAME = 'room_type_id'
    ) THEN
        ALTER TABLE booking_details ADD COLUMN room_type_id BIGINT NULL AFTER booking_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'booking_details'
          AND COLUMN_NAME = 'assigned_by_employee_id'
    ) THEN
        ALTER TABLE booking_details ADD COLUMN assigned_by_employee_id BIGINT NULL AFTER room_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'booking_details'
          AND COLUMN_NAME = 'room_assignment_status'
    ) THEN
        ALTER TABLE booking_details ADD COLUMN room_assignment_status VARCHAR(20) NOT NULL DEFAULT 'UNASSIGNED' AFTER rent_type;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'booking_details'
          AND COLUMN_NAME = 'assigned_at'
    ) THEN
        ALTER TABLE booking_details ADD COLUMN assigned_at DATETIME NULL AFTER room_assignment_status;
    END IF;
END//
DELIMITER ;
CALL prepare_room_type_booking_schema();
DROP PROCEDURE IF EXISTS prepare_room_type_booking_schema;

ALTER TABLE booking_details MODIFY COLUMN room_id BIGINT NULL;

CREATE TABLE IF NOT EXISTS booking_guests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    booking_detail_id BIGINT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    identity_document_type VARCHAR(20) NOT NULL DEFAULT 'CCCD',
    identity_document_number VARCHAR(30) NOT NULL,
    date_of_birth DATE NULL,
    gender VARCHAR(20) NULL,
    nationality VARCHAR(50) NOT NULL DEFAULT 'VIETNAM',
    phone VARCHAR(15) NULL,
    address VARCHAR(255) NULL,
    is_primary_guest BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by_employee_id BIGINT NULL,
    verified_at DATETIME NULL,
    note TEXT NULL,
    CONSTRAINT uq_booking_guest_identity UNIQUE (booking_detail_id, identity_document_number)
);

-- ============================================================
-- 1. roles - 5 rows
-- ============================================================
INSERT INTO roles (id, name, description) VALUES
(1, 'ROLE_ADMIN', 'Quan tri he thong'),
(2, 'ROLE_CUSTOMER', 'Khach hang dat phong'),
(3, 'ROLE_RECEPTIONIST', 'Nhan vien le tan'),
(4, 'ROLE_HOUSEKEEPING', 'Nhan vien buong phong'),
(5, 'ROLE_MARKETING', 'Nhan vien marketing')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- ============================================================
-- 2. accounts - 10 rows because customers and employees are one-to-one
-- ============================================================
INSERT INTO accounts (id, email, password, role_id, is_active, created_at) VALUES
(1, 'admin@example.com', @sample_password, 1, TRUE, @yesterday_0800),
(2, 'receptionist.mai@example.com', @sample_password, 3, TRUE, @yesterday_0900),
(3, 'customer.an@example.com', @sample_password, 2, TRUE, @yesterday_1000),
(4, 'housekeeping.hoa@example.com', @sample_password, 4, TRUE, @today_0800),
(5, 'marketing.nam@example.com', @sample_password, 5, TRUE, @today_0900),
(6, 'customer.linh@example.com', @sample_password, 2, TRUE, @yesterday_0800),
(7, 'customer.minh@example.com', @sample_password, 2, TRUE, @yesterday_0900),
(8, 'customer.thao@example.com', @sample_password, 2, TRUE, @yesterday_1000),
(9, 'customer.khoa@example.com', @sample_password, 2, TRUE, @today_0800),
(10, 'receptionist.hung@example.com', @sample_password, 3, TRUE, @today_0900)
ON DUPLICATE KEY UPDATE email = VALUES(email), password = VALUES(password), role_id = VALUES(role_id), is_active = VALUES(is_active), created_at = VALUES(created_at);

-- ============================================================
-- 3. customers - 5 rows
-- ============================================================
INSERT INTO customers (id, account_id, full_name, phone, address, avatar_url, date_of_birth) VALUES
(3, 3, 'Nguyen Van An', '0900000001', 'Quan 1, TP Ho Chi Minh', NULL, '1995-03-15'),
(6, 6, 'Nguyen Khanh Linh', '0900000002', 'Da Lat, Lam Dong', NULL, '1998-07-21'),
(7, 7, 'Tran Duc Minh', '0900000003', 'Nha Trang, Khanh Hoa', NULL, '1992-11-09'),
(8, 8, 'Pham Minh Thao', '0900000004', 'Thu Duc, TP Ho Chi Minh', NULL, '1999-02-24'),
(9, 9, 'Le Anh Khoa', '0900000005', 'Hoi An, Quang Nam', NULL, '1990-10-02')
ON DUPLICATE KEY UPDATE account_id = VALUES(account_id), full_name = VALUES(full_name), phone = VALUES(phone), address = VALUES(address), avatar_url = VALUES(avatar_url), date_of_birth = VALUES(date_of_birth);

-- ============================================================
-- 4. employees - 5 rows
-- ============================================================
INSERT INTO employees (id, account_id, full_name, phone, address, avatar_url, status, date_of_birth) VALUES
(1, 1, 'Admin Homestay', '0910000001', 'Van phong homestay', NULL, 'WORKING', '1988-01-10'),
(2, 2, 'Le Tan Mai', '0910000002', 'Quay le tan ca sang', NULL, 'WORKING', '1996-04-18'),
(3, 10, 'Le Tan Hung', '0910000003', 'Quay le tan ca chieu', NULL, 'WORKING', '1994-09-23'),
(4, 4, 'Buong Phong Hoa', '0910000004', 'Bo phan buong phong', NULL, 'WORKING', '1993-12-01'),
(5, 5, 'Marketing Nam', '0910000005', 'Bo phan marketing', NULL, 'WORKING', '1997-06-12')
ON DUPLICATE KEY UPDATE account_id = VALUES(account_id), full_name = VALUES(full_name), phone = VALUES(phone), address = VALUES(address), avatar_url = VALUES(avatar_url), status = VALUES(status), date_of_birth = VALUES(date_of_birth);

-- ============================================================
-- 5. deposit_policies - 5 rows
-- ============================================================
INSERT INTO deposit_policies (id, policy_name, calculation_type, policy_value, description) VALUES
(1, 'Khong yeu cau dat coc', 'FIXED_AMOUNT', 0.00, 'Ap dung cho khach than thiet hoac booking noi bo'),
(2, 'Dat coc 30%', 'PERCENTAGE', 30.00, 'Chinh sach coc nhe cho phong tieu chuan'),
(3, 'Dat coc 50%', 'PERCENTAGE', 50.00, 'Chinh sach coc mac dinh'),
(4, 'Dat coc 75%', 'PERCENTAGE', 75.00, 'Ap dung cho phong cao cap hoac cao diem'),
(5, 'Coc co dinh 200k', 'FIXED_AMOUNT', 200000.00, 'Giu cho bang so tien co dinh')
ON DUPLICATE KEY UPDATE policy_name = VALUES(policy_name), calculation_type = VALUES(calculation_type), policy_value = VALUES(policy_value), description = VALUES(description);

-- ============================================================
-- 6. room_types - 5 rows
-- ============================================================
INSERT INTO room_types (id, name, max_adults, max_children, deposit_policy_id, description) VALUES
(1, 'Studio', 2, 1, 2, 'Phong nho gon cho cap doi hoac khach cong tac'),
(2, 'Deluxe', 2, 2, 3, 'Phong doi cao cap co ban cong va view vuon'),
(3, 'Family', 4, 2, 3, 'Phong rong rai cho gia dinh'),
(4, 'VIP Suite', 2, 1, 4, 'Suite cao cap voi khong gian rieng tu'),
(5, 'Connecting Room', 4, 3, 5, 'Hai phong ket noi phu hop nhom ban')
ON DUPLICATE KEY UPDATE name = VALUES(name), max_adults = VALUES(max_adults), max_children = VALUES(max_children), deposit_policy_id = VALUES(deposit_policy_id), description = VALUES(description);

-- ============================================================
-- 7. rooms - 5 rows
-- ============================================================
INSERT INTO rooms (id, room_number, room_type_id) VALUES
(1, '101', 1),
(2, '102', 2),
(3, '201', 3),
(4, '202', 4),
(5, '301', 5)
ON DUPLICATE KEY UPDATE room_number = VALUES(room_number), room_type_id = VALUES(room_type_id);

-- ============================================================
-- 8. room_images - 5 rows
-- ============================================================
INSERT INTO room_images (id, room_id, image_url, is_primary) VALUES
(1, 1, '/home_1/image.png', TRUE),
(2, 2, '/home_2/image_1.jpg', TRUE),
(3, 3, '/home_3/image_3.jpg', TRUE),
(4, 4, '/home_4/image_1.jpg', TRUE),
(5, 5, '/home_5/image_1.jpg', TRUE)
ON DUPLICATE KEY UPDATE room_id = VALUES(room_id), image_url = VALUES(image_url), is_primary = VALUES(is_primary);

-- ============================================================
-- 9. room_schedules - 5 rows
-- ============================================================
INSERT INTO room_schedules (id, room_id, start_time, end_time, status, note) VALUES
(1, 1, @today_1400, @tomorrow_1100, 'OCCUPIED', 'Booking detail 1 da gan phong 101'),
(2, 2, @today_1400, @tomorrow_1100, 'OCCUPIED', 'Booking detail 2 da gan phong 102'),
(3, 3, @today_1000, @tomorrow_1200, 'OCCUPIED', 'Booking detail 3 dang luu tru'),
(4, 4, @today_0800, @today_1200, 'CLEANING', 'Don phong sau booking detail 4'),
(5, 5, @today_1900, @next_day_1100, 'OCCUPIED', 'Booking detail 5 da gan phong 301')
ON DUPLICATE KEY UPDATE room_id = VALUES(room_id), start_time = VALUES(start_time), end_time = VALUES(end_time), status = VALUES(status), note = VALUES(note);

-- ============================================================
-- 10. price_policies - 5 rows
-- ============================================================
INSERT INTO price_policies (id, policy_name, rent_type, standard_check_in, standard_check_out, limit_hours) VALUES
(1, 'Thue qua dem', 'OVERNIGHT', '19:00:00', '11:00:00', NULL),
(2, 'Thue theo ngay', 'DAILY', '14:00:00', '12:00:00', NULL),
(3, 'Combo 2 gio', 'COMBO', NULL, NULL, 2),
(4, 'Combo 4 gio', 'COMBO', NULL, NULL, 4),
(5, 'Thue theo gio', 'HOURLY', NULL, NULL, 1)
ON DUPLICATE KEY UPDATE policy_name = VALUES(policy_name), rent_type = VALUES(rent_type), standard_check_in = VALUES(standard_check_in), standard_check_out = VALUES(standard_check_out), limit_hours = VALUES(limit_hours);

-- ============================================================
-- 11. room_price_configs - 5 rows
-- ============================================================
INSERT INTO room_price_configs (id, room_type_id, price_policy_id, day_type, price) VALUES
(1, 1, 2, 'WEEKDAY', 500000.00),
(2, 2, 2, 'WEEKDAY', 800000.00),
(3, 3, 2, 'WEEKDAY', 1200000.00),
(4, 4, 3, 'WEEKDAY', 700000.00),
(5, 5, 1, 'WEEKEND', 1500000.00)
ON DUPLICATE KEY UPDATE room_type_id = VALUES(room_type_id), price_policy_id = VALUES(price_policy_id), day_type = VALUES(day_type), price = VALUES(price);

-- ============================================================
-- 12. bookings - 5 rows
-- ============================================================
INSERT INTO bookings (id, customer_id, deposit_policy_id, booking_date, status) VALUES
(1, 3, 2, @yesterday_0900, 'CONFIRMED'),
(2, 6, 3, @yesterday_1000, 'CHECKED_IN'),
(3, 7, 3, @today_0800, 'CHECKED_IN'),
(4, 8, 4, @today_0900, 'COMPLETED'),
(5, 9, 5, @today_1000, 'CONFIRMED')
ON DUPLICATE KEY UPDATE customer_id = VALUES(customer_id), deposit_policy_id = VALUES(deposit_policy_id), booking_date = VALUES(booking_date), status = VALUES(status);

-- ============================================================
-- 13. booking_details - 5 rows
-- Customer booked room_type_id; receptionist assigned concrete room_id later.
-- ============================================================
INSERT INTO booking_details (
    id, booking_id, room_type_id, room_id, assigned_by_employee_id,
    check_in_target, check_out_target, number_of_adults, number_of_children,
    price_at_booking, rent_type, room_assignment_status, assigned_at, status
) VALUES
(1, 1, 1, 1, 2, @today_1400, @tomorrow_1100, 2, 0, 500000.00, 'DAILY', 'ASSIGNED', @today_1300, 'CONFIRMED'),
(2, 2, 2, 2, 2, @today_1400, @tomorrow_1100, 2, 1, 800000.00, 'DAILY', 'ASSIGNED', @today_1300, 'CHECKED_IN'),
(3, 3, 3, 3, 3, @today_1000, @tomorrow_1200, 2, 2, 1200000.00, 'DAILY', 'ASSIGNED', @today_0900, 'CHECKED_IN'),
(4, 4, 4, 4, 2, @today_0800, @today_1200, 2, 0, 700000.00, 'COMBO', 'ASSIGNED', @today_0800, 'COMPLETED'),
(5, 5, 5, 5, 3, @today_1900, @next_day_1100, 4, 2, 1500000.00, 'OVERNIGHT', 'ASSIGNED', @today_1800, 'CONFIRMED')
ON DUPLICATE KEY UPDATE booking_id = VALUES(booking_id), room_type_id = VALUES(room_type_id), room_id = VALUES(room_id), assigned_by_employee_id = VALUES(assigned_by_employee_id), check_in_target = VALUES(check_in_target), check_out_target = VALUES(check_out_target), number_of_adults = VALUES(number_of_adults), number_of_children = VALUES(number_of_children), price_at_booking = VALUES(price_at_booking), rent_type = VALUES(rent_type), room_assignment_status = VALUES(room_assignment_status), assigned_at = VALUES(assigned_at), status = VALUES(status);

-- ============================================================
-- 14. booking_guests - 5 rows
-- Real guests verified by receptionist using identity documents.
-- ============================================================
INSERT INTO booking_guests (
    id, booking_id, booking_detail_id, full_name, identity_document_type,
    identity_document_number, date_of_birth, gender, nationality, phone,
    address, is_primary_guest, verified_by_employee_id, verified_at, note
) VALUES
(1, 1, 1, 'Nguyen Van An', 'CCCD', '079095000001', '1995-03-15', 'MALE', 'VIETNAM', '0900000001', 'Quan 1, TP Ho Chi Minh', TRUE, 2, @today_1300, 'Khach dai dien phong Studio'),
(2, 2, 2, 'Nguyen Khanh Linh', 'CCCD', '068098000002', '1998-07-21', 'FEMALE', 'VIETNAM', '0900000002', 'Da Lat, Lam Dong', TRUE, 2, @today_1400, 'Khach dai dien phong Deluxe'),
(3, 3, 3, 'Tran Duc Minh', 'CCCD', '056092000003', '1992-11-09', 'MALE', 'VIETNAM', '0900000003', 'Nha Trang, Khanh Hoa', TRUE, 3, @today_1000, 'Khach dai dien phong Family'),
(4, 4, 4, 'Pham Minh Thao', 'CCCD', '079099000004', '1999-02-24', 'FEMALE', 'VIETNAM', '0900000004', 'Thu Duc, TP Ho Chi Minh', TRUE, 2, @today_0800, 'Khach da hoan tat check-out'),
(5, 5, 5, 'Le Anh Khoa', 'CCCD', '048090000005', '1990-10-02', 'MALE', 'VIETNAM', '0900000005', 'Hoi An, Quang Nam', TRUE, 3, @today_1800, 'Khach dai dien phong Connecting')
ON DUPLICATE KEY UPDATE booking_id = VALUES(booking_id), booking_detail_id = VALUES(booking_detail_id), full_name = VALUES(full_name), identity_document_type = VALUES(identity_document_type), identity_document_number = VALUES(identity_document_number), date_of_birth = VALUES(date_of_birth), gender = VALUES(gender), nationality = VALUES(nationality), phone = VALUES(phone), address = VALUES(address), is_primary_guest = VALUES(is_primary_guest), verified_by_employee_id = VALUES(verified_by_employee_id), verified_at = VALUES(verified_at), note = VALUES(note);

-- ============================================================
-- 15. check_in_records - 5 rows
-- ============================================================
INSERT INTO check_in_records (
    id, booking_detail_id, customer_id, housekeeping_id, receptionist_id,
    actual_check_in, actual_check_out, early_check_in_fee, late_check_out_fee
) VALUES
(1, 1, 3, 4, 2, @today_1400, NULL, 0.00, 0.00),
(2, 2, 6, 4, 2, @today_1400, NULL, 0.00, 0.00),
(3, 3, 7, 4, 3, @today_1000, NULL, 0.00, 0.00),
(4, 4, 8, 4, 2, @today_0800, @today_1200, 0.00, 100000.00),
(5, 5, 9, 4, 3, @today_1900, NULL, 0.00, 0.00)
ON DUPLICATE KEY UPDATE booking_detail_id = VALUES(booking_detail_id), customer_id = VALUES(customer_id), housekeeping_id = VALUES(housekeeping_id), receptionist_id = VALUES(receptionist_id), actual_check_in = VALUES(actual_check_in), actual_check_out = VALUES(actual_check_out), early_check_in_fee = VALUES(early_check_in_fee), late_check_out_fee = VALUES(late_check_out_fee);

-- ============================================================
-- 16. facility_services - 5 rows
-- ============================================================
INSERT INTO facility_services (id, name, price, is_active) VALUES
(1, 'Ve be boi', 80000.00, TRUE),
(2, 'Ve phong gym', 60000.00, TRUE),
(3, 'Su dung san BBQ', 200000.00, TRUE),
(4, 'Bua sang buffet', 120000.00, TRUE),
(5, 'Don phong them trong ngay', 70000.00, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price), is_active = VALUES(is_active);

-- ============================================================
-- 17. inventory_services - 5 rows
-- ============================================================
INSERT INTO inventory_services (id, name, price, quantity_in_stock) VALUES
(1, 'Thue xe dap', 50000.00, 12),
(2, 'Thue xe may', 150000.00, 6),
(3, 'Giat ui theo kg', 30000.00, 100),
(4, 'Thue bep nuong mini', 100000.00, 4),
(5, 'Thue ao phao tre em', 40000.00, 20)
ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price), quantity_in_stock = VALUES(quantity_in_stock);

-- ============================================================
-- 18. booking_service_items - 5 rows
-- ============================================================
INSERT INTO booking_service_items (id, booking_detail_id, facility_service_id, inventory_service_id, quantity, price_at_booking) VALUES
(1, 1, 4, NULL, 2, 120000.00),
(2, 2, 1, NULL, 3, 80000.00),
(3, 3, 3, NULL, 1, 200000.00),
(4, 4, NULL, 1, 1, 50000.00),
(5, 5, NULL, 4, 1, 100000.00)
ON DUPLICATE KEY UPDATE booking_detail_id = VALUES(booking_detail_id), facility_service_id = VALUES(facility_service_id), inventory_service_id = VALUES(inventory_service_id), quantity = VALUES(quantity), price_at_booking = VALUES(price_at_booking);

-- ============================================================
-- 19. room_mini_bar_items - 5 rows
-- ============================================================
INSERT INTO room_mini_bar_items (id, name, price, quantity_in_stock) VALUES
(1, 'Nuoc suoi', 10000.00, 200),
(2, 'Coca Cola', 15000.00, 120),
(3, 'Mi ly', 25000.00, 80),
(4, 'Snack khoai tay', 20000.00, 90),
(5, 'Ca phe lon', 18000.00, 60)
ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price), quantity_in_stock = VALUES(quantity_in_stock);

-- ============================================================
-- 20. service_usages - 5 rows
-- ============================================================
INSERT INTO service_usages (id, check_in_record_id, facility_service_id, inventory_service_id, quantity, price_at_use) VALUES
(1, 1, 4, NULL, 2, 120000.00),
(2, 2, 1, NULL, 3, 80000.00),
(3, 3, 3, NULL, 1, 200000.00),
(4, 4, NULL, 1, 1, 50000.00),
(5, 5, NULL, 4, 1, 100000.00)
ON DUPLICATE KEY UPDATE check_in_record_id = VALUES(check_in_record_id), facility_service_id = VALUES(facility_service_id), inventory_service_id = VALUES(inventory_service_id), quantity = VALUES(quantity), price_at_use = VALUES(price_at_use);

-- ============================================================
-- 21. room_amenities_usage - 5 rows
-- ============================================================
INSERT INTO room_amenities_usage (id, check_in_record_id, item_id, quantity_used) VALUES
(1, 1, 1, 2),
(2, 2, 2, 2),
(3, 3, 3, 1),
(4, 4, 4, 1),
(5, 5, 5, 2)
ON DUPLICATE KEY UPDATE check_in_record_id = VALUES(check_in_record_id), item_id = VALUES(item_id), quantity_used = VALUES(quantity_used);

-- ============================================================
-- 22. rules_penalties - 5 rows
-- ============================================================
INSERT INTO rules_penalties (id, title, penalty_amount) VALUES
(1, 'Hut thuoc trong phong', 500000.00),
(2, 'Lam mat chia khoa phong', 200000.00),
(3, 'Lam ban chan ga kho xu ly', 300000.00),
(4, 'Lam hong xe dap thue', 700000.00),
(5, 'Tra phong tre qua gio', 100000.00)
ON DUPLICATE KEY UPDATE title = VALUES(title), penalty_amount = VALUES(penalty_amount);

-- ============================================================
-- 23. applied_penalties - 5 rows
-- ============================================================
INSERT INTO applied_penalties (id, check_record_id, rules_penalty_id, actual_fine, description) VALUES
(1, 1, 5, 0.00, 'Khach chua phat sinh phi'),
(2, 2, 5, 0.00, 'Khach chua phat sinh phi'),
(3, 3, 1, 500000.00, 'Phat hien mui thuoc trong phong Family'),
(4, 4, 2, 200000.00, 'Khach lam mat mot chia khoa phong VIP'),
(5, 5, 3, 300000.00, 'Chan ga can xu ly rieng sau khi check-out')
ON DUPLICATE KEY UPDATE check_record_id = VALUES(check_record_id), rules_penalty_id = VALUES(rules_penalty_id), actual_fine = VALUES(actual_fine), description = VALUES(description);

-- ============================================================
-- 24. invoices - 5 rows
-- ============================================================
INSERT INTO invoices (id, booking_id, employee_id, room_charge, penalty_charge, service_charge, total_amount, created_at) VALUES
(1, 1, 2, 500000.00, 0.00, 260000.00, 760000.00, @today_1500),
(2, 2, 2, 800000.00, 0.00, 270000.00, 1070000.00, @today_1500),
(3, 3, 3, 1200000.00, 500000.00, 225000.00, 1925000.00, @today_1100),
(4, 4, 2, 700000.00, 300000.00, 70000.00, 1070000.00, @today_1300),
(5, 5, 3, 1500000.00, 300000.00, 136000.00, 1936000.00, @today_2000)
ON DUPLICATE KEY UPDATE booking_id = VALUES(booking_id), employee_id = VALUES(employee_id), room_charge = VALUES(room_charge), penalty_charge = VALUES(penalty_charge), service_charge = VALUES(service_charge), total_amount = VALUES(total_amount), created_at = VALUES(created_at);

-- ============================================================
-- 25. payments - 5 rows
-- ============================================================
INSERT INTO payments (
    id, invoice_id, payment_method, transaction_no, payment_code,
    sepay_transaction_id, qr_code_url, payment_purpose, amount, status, payment_time
) VALUES
(1, 1, 'BANK_TRANSFER', 'BANK-DEMO-0001', 'HMS000001', 100001, 'https://qr.sepay.vn/demo/HMS000001', 'BOOKING', 760000.00, 'SUCCESS', @today_1500),
(2, 2, 'CASH', NULL, 'HMS000002', NULL, NULL, 'CHECKOUT', 1070000.00, 'SUCCESS', @today_1500),
(3, 3, 'BANK_TRANSFER', 'BANK-DEMO-0003', 'HMS000003', 100003, 'https://qr.sepay.vn/demo/HMS000003', 'CHECKOUT', 1925000.00, 'SUCCESS', @today_1100),
(4, 4, 'MOMO', 'MOMO-DEMO-0004', 'HMS000004', NULL, NULL, 'CHECKOUT', 1070000.00, 'SUCCESS', @today_1300),
(5, 5, 'BANK_TRANSFER', 'BANK-DEMO-0005', 'HMS000005', 100005, 'https://qr.sepay.vn/demo/HMS000005', 'BOOKING', 1936000.00, 'PENDING', NULL)
ON DUPLICATE KEY UPDATE invoice_id = VALUES(invoice_id), payment_method = VALUES(payment_method), transaction_no = VALUES(transaction_no), payment_code = VALUES(payment_code), sepay_transaction_id = VALUES(sepay_transaction_id), qr_code_url = VALUES(qr_code_url), payment_purpose = VALUES(payment_purpose), amount = VALUES(amount), status = VALUES(status), payment_time = VALUES(payment_time);

-- ============================================================
-- 26. vouchers - 5 rows
-- ============================================================
INSERT INTO vouchers (id, code, discount_type, min_order_value, max_discount_amount, start_date, end_date, usage_limit, used_count, discount_value) VALUES
(1, 'WELCOME10', 'PERCENT', 500000.00, 200000.00, TIMESTAMP(@yesterday, '00:00:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 180 DAY), '23:59:59'), 100, 5, 10.00),
(2, 'FAMILY200', 'AMOUNT', 1500000.00, 200000.00, TIMESTAMP(@yesterday, '00:00:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 90 DAY), '23:59:59'), 50, 1, 200000.00),
(3, 'VIP15', 'PERCENT', 2000000.00, 500000.00, TIMESTAMP(@yesterday, '00:00:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 60 DAY), '23:59:59'), 30, 2, 15.00),
(4, 'BBQFREE', 'AMOUNT', 1000000.00, 200000.00, TIMESTAMP(@yesterday, '00:00:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 30 DAY), '23:59:59'), 20, 0, 200000.00),
(5, 'SUMMER5', 'PERCENT', 300000.00, 100000.00, TIMESTAMP(@yesterday, '00:00:00'), TIMESTAMP(DATE_ADD(@today, INTERVAL 120 DAY), '23:59:59'), 200, 12, 5.00)
ON DUPLICATE KEY UPDATE code = VALUES(code), discount_type = VALUES(discount_type), min_order_value = VALUES(min_order_value), max_discount_amount = VALUES(max_discount_amount), start_date = VALUES(start_date), end_date = VALUES(end_date), usage_limit = VALUES(usage_limit), used_count = VALUES(used_count), discount_value = VALUES(discount_value);

-- ============================================================
-- 27. customer_loyalty - 5 rows
-- ============================================================
INSERT INTO customer_loyalty (id, customer_id, current_points, total_earned_points) VALUES
(1, 3, 120, 500),
(2, 6, 40, 40),
(3, 7, 220, 220),
(4, 8, 0, 0),
(5, 9, 10, 10)
ON DUPLICATE KEY UPDATE customer_id = VALUES(customer_id), current_points = VALUES(current_points), total_earned_points = VALUES(total_earned_points);

-- ============================================================
-- 28. ai_agent_configs - 5 rows
-- ============================================================
INSERT INTO ai_agent_configs (id, agent_name, system_prompt, posting_interval_hours, is_active) VALUES
(1, 'Weekend Promo Agent', 'Viet bai quang ba phong cuoi tuan ngan gon va than thien.', 24, TRUE),
(2, 'Family Travel Agent', 'Goi y noi dung cho nhom khach gia dinh co tre nho.', 48, TRUE),
(3, 'VIP Suite Agent', 'Viet noi dung cao cap cho phong VIP Suite.', 72, TRUE),
(4, 'Local Experience Agent', 'Quang ba trai nghiem BBQ, ho boi va kham pha dia phuong.', 36, TRUE),
(5, 'Dormant Agent', 'Cau hinh thu nghiem dang tat.', 168, FALSE)
ON DUPLICATE KEY UPDATE agent_name = VALUES(agent_name), system_prompt = VALUES(system_prompt), posting_interval_hours = VALUES(posting_interval_hours), is_active = VALUES(is_active);

-- ============================================================
-- 29. marketing_posts - 5 rows
-- ============================================================
INSERT INTO marketing_posts (id, platform, generated_content, media_url, scheduled_at, posted_at, status, external_post_id, creator_id, agent_config_id) VALUES
(1, 'FACEBOOK', 'Cuoi tuan nay ghe homestay nghi duong voi phong Deluxe view vuon.', '/banner.png', @today_1800, NULL, 'SCHEDULED', NULL, 5, 1),
(2, 'INSTAGRAM', 'Phong Studio am cung cho chuyen di ngan ngay.', '/home_1/image.png', @yesterday_0800, @yesterday_0900, 'POSTED', 'IG-DEMO-0001', 5, 1),
(3, 'FACEBOOK', 'Phong Family rong rai, phu hop gia dinh co tre nho.', '/home_3/image_3.jpg', @today_1900, NULL, 'SCHEDULED', NULL, 5, 2),
(4, 'TIKTOK', 'Mot ngay nghi duong tai VIP Suite co gi dac biet?', '/home_4/image_1.jpg', @today_2000, NULL, 'DRAFT', NULL, 5, 3),
(5, 'INSTAGRAM', 'Toi nay BBQ ngoai troi va tan huong khong khi Da Lat.', '/home_5/image_1.jpg', @tomorrow_0900, NULL, 'SCHEDULED', NULL, 5, 4)
ON DUPLICATE KEY UPDATE platform = VALUES(platform), generated_content = VALUES(generated_content), media_url = VALUES(media_url), scheduled_at = VALUES(scheduled_at), posted_at = VALUES(posted_at), status = VALUES(status), external_post_id = VALUES(external_post_id), creator_id = VALUES(creator_id), agent_config_id = VALUES(agent_config_id);
