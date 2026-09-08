-- ======================================================================
-- SCRIPT CẬP NHẬT TÊN CÁC DỊCH VỤ VÀ MẶT HÀNG MINI-BAR THÀNH TIẾNG VIỆT CÓ DẤU
-- ======================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

USE homestayManagement;

-- 1. Dịch vụ tiện ích (facility_services)
UPDATE facility_services SET name = 'Vé bể bơi' WHERE id = 1;
UPDATE facility_services SET name = 'Vé phòng gym' WHERE id = 2;
UPDATE facility_services SET name = 'Sử dụng sân BBQ' WHERE id = 3;
UPDATE facility_services SET name = 'Bữa sáng buffet' WHERE id = 4;
UPDATE facility_services SET name = 'Dọn phòng thêm trong ngày' WHERE id = 5;

-- 2. Dịch vụ thuê đồ (inventory_services)
UPDATE inventory_services SET name = 'Thuê xe đạp' WHERE id = 1;
UPDATE inventory_services SET name = 'Thuê xe máy' WHERE id = 2;
UPDATE inventory_services SET name = 'Giặt ủi theo kg' WHERE id = 3;
UPDATE inventory_services SET name = 'Thuê bếp nướng mini' WHERE id = 4;
UPDATE inventory_services SET name = 'Thuê áo phao trẻ em' WHERE id = 5;
UPDATE inventory_services SET name = 'Thuê xe máy' WHERE id = 6;

-- 3. Thực phẩm mini-bar (room_mini_bar_items)
UPDATE room_mini_bar_items SET name = 'Nước suối' WHERE id = 1;
UPDATE room_mini_bar_items SET name = 'Coca-Cola' WHERE id = 2;
UPDATE room_mini_bar_items SET name = 'Mì ly' WHERE id = 3;
UPDATE room_mini_bar_items SET name = 'Snack khoai tây' WHERE id = 4;
UPDATE room_mini_bar_items SET name = 'Cà phê lon' WHERE id = 5;
UPDATE room_mini_bar_items SET name = 'Ba lon bia' WHERE id = 6;

-- Kiểm tra lại kết quả
SELECT 'facility_services' AS danh_muc, id, name, price FROM facility_services
UNION ALL
SELECT 'inventory_services', id, name, price FROM inventory_services
UNION ALL
SELECT 'room_mini_bar_items', id, name, price FROM room_mini_bar_items;
