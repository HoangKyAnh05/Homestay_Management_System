# Database Design - Homestay Management System

Tai lieu nay mo ta mo hinh database sau khi dieu chinh nghiep vu:

- Customer dat phong theo loai phong, khong chon so phong vat ly.
- He thong giu ton kho theo loai phong bang `booking_details.room_type_id`.
- Le tan gan phong cu the khi khach den check-in bang `booking_details.room_id`.
- Moi nguoi luu tru duoc xac thuc bang giay to tuy than trong bang `booking_guests`.

## 1. Tai Khoan Va Phan Quyen

### `roles`

Luu danh sach vai tro dung cho RBAC va Spring Security.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `name` | varchar(20) | Unique, vi du `ROLE_ADMIN`, `ROLE_CUSTOMER`, `ROLE_RECEPTIONIST` |
| `description` | varchar(200) | Mo ta quyen |

### `accounts`

Luu thong tin dang nhap chung cho customer va employee.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `email` | varchar(50) | Unique, username dang nhap |
| `password` | varchar(255) | Mat khau da ma hoa |
| `role_id` | bigint | FK -> `roles.id` |
| `is_active` | boolean | Trang thai tai khoan |
| `created_at` | datetime | Thoi gian tao |

### `customers`

Dai dien cho nguoi dat phong hoặc chu tai khoan customer. Bang nay khong dung de luu CCCD cua tat ca nguoi luu tru, vi mot booking co the co nhieu khach o cung.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `account_id` | bigint | FK -> `accounts.id`, unique |
| `full_name` | varchar(100) | Ho ten customer |
| `phone` | varchar(10) | So dien thoai |
| `address` | varchar(255) | Dia chi |
| `avatar_url` | varchar(255) | Anh dai dien |
| `date_of_birth` | date | Ngay sinh |

### `employees`

Luu ho so nhan vien noi bo, gom le tan, buong phong, admin.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `account_id` | bigint | FK -> `accounts.id`, unique |
| `full_name` | varchar(100) | Ho ten nhan vien |
| `phone` | varchar(15) | So dien thoai |
| `address` | varchar(255) | Dia chi |
| `avatar_url` | varchar(255) | Anh dai dien |
| `status` | varchar(20) | `WORKING`, `RESIGNED` |
| `date_of_birth` | date | Ngay sinh |

## 2. Phong Va Loai Phong

### `room_types`

Bang trung tam hien thi cho customer khi dat phong. Customer chon loai phong, khong chon phong vat ly.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `name` | varchar(100) | Ten loai phong, vi du Deluxe, Family |
| `max_adults` | int | So nguoi lon toi da |
| `max_children` | int | So tre em toi da |
| `deposit_policy_id` | bigint | FK -> `deposit_policies.id`, nullable |
| `description` | text | Mo ta loai phong |

### `rooms`

Dinh danh phong vat ly thuc te. Phong nay chi duoc gan vao booking khi le tan lam thu tuc check-in.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `room_number` | varchar(10) | Unique, vi du 101, 102 |
| `room_type_id` | bigint | FK -> `room_types.id` |
| `status` | varchar(20) | Trang thai hien tai: `AVAILABLE`, `OCCUPIED`, `CLEANING`, `MAINTENANCE` |

`rooms.status` la trang thai van hanh hien tai cua phong. Khi check-in, phong chuyen sang `OCCUPIED`; housekeeping nhan viec thi chuyen sang `CLEANING`; chi khi don phong xong moi chuyen ve `AVAILABLE`.

Trang Lich trang thai phong khong tao them bang trang thai theo ngay. Moi o lich duoc tong hop tu `booking_details`, `housekeeping_tasks`, `room_schedules` va `rooms.status` theo thu tu uu tien: `MAINTENANCE` -> `CLEANING` -> `OCCUPIED` -> `BOOKED` -> `AVAILABLE`. Cach nay tranh luu trung va tranh lech trang thai giua lich voi nghiep vu thuc te.

Tren ma tran ngay, moi booking chi hien thi tai ngay cua `booking_details.check_in_target`. Ngay `check_out_target` khong tao them mot o booking rieng, tranh truong hop mot booking qua dem bi dem va hien thi hai lan.

Khi Admin mo chi tiet mot phong de truy vet phan anh ve ve sinh, he thong lay `housekeeping_tasks` co `cleaning_completed_at` gan nhat nhung khong lon hon thoi diem check-in cua booking dang xem. Danh sach da lam, nguoi thuc hien va thoi gian tung muc duoc doc tu `housekeeping_task_checklist_items`; khong can them bang lich su hoac bang danh gia chat luong.

### `room_images`

Anh hien tai gan theo phong vat ly. Khi hien thi theo loai phong, co the lay anh tu mot phong dai dien trong cung loai phong.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `room_id` | bigint | FK -> `rooms.id` |
| `image_url` | varchar(255) | Link anh |
| `is_primary` | boolean | Anh dai dien |

### `room_schedules`

Quan ly trang thai phong vat ly theo thoi gian, vi du bao tri, dang don dep.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `room_id` | bigint | FK -> `rooms.id` |
| `start_time` | datetime | Bat dau |
| `end_time` | datetime | Ket thuc |
| `status` | varchar(20) | `AVAILABLE`, `OCCUPIED`, `CLEANING`, `MAINTENANCE` |
| `note` | varchar(255) | Ghi chu |

## 3. Gia, Coc Va Chinh Sach Thue

### `price_policies`

Dinh nghia goi thue: theo gio, qua dem, theo ngay, combo.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `policy_name` | varchar(100) | Ten goi thue |
| `rent_type` | varchar(20) | `HOURLY`, `OVERNIGHT`, `DAILY`, `COMBO` |
| `standard_check_in` | time | Gio check-in tieu chuan |
| `standard_check_out` | time | Gio check-out tieu chuan |
| `limit_hours` | int | So gio ap dung cho goi theo gio/combo |

### `room_price_configs`

Luu gia theo ma tran loai phong x goi thue x loai ngay. Bang nay phu hop voi booking theo loai phong.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `room_type_id` | bigint | FK -> `room_types.id` |
| `price_policy_id` | bigint | FK -> `price_policies.id` |
| `day_type` | varchar(20) | `WEEKDAY`, `WEEKEND` |
| `price` | decimal(10,2) | Gia tai cau hinh |

Unique constraint: `room_type_id`, `price_policy_id`, `day_type`.

### `deposit_policies`

Chinh sach dat coc ap dung cho loai phong.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `policy_name` | varchar(100) | Ten chinh sach |
| `calculation_type` | varchar(20) | `PERCENTAGE`, `FIXED_AMOUNT` |
| `policy_value` | decimal(10,2) | Gia tri coc |
| `description` | text | Mo ta |

## 4. Booking Theo Loai Phong

### `bookings`

Don dat phong tong. Customer tao booking online de giu cho.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `customer_id` | bigint | FK -> `customers.id` |
| `deposit_policy_id` | bigint | FK -> `deposit_policies.id`, nullable |
| `booking_date` | datetime | Thoi gian dat |
| `status` | varchar(20) | `PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED` |

### `booking_details`

Moi dong dai dien cho 1 phong duoc ban trong booking. Khi customer dat online, dong nay bat buoc co `room_type_id` nhung `room_id` co the null. Khi den check-in, le tan chon phong vat ly dung loai phong va cap nhat `room_id`.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `booking_id` | bigint | FK -> `bookings.id` |
| `room_type_id` | bigint | FK -> `room_types.id`, bat buoc |
| `room_id` | bigint | FK -> `rooms.id`, nullable den khi gan phong |
| `assigned_by_employee_id` | bigint | FK -> `employees.id`, nullable |
| `check_in_target` | datetime | Thoi gian nhan phong du kien |
| `check_out_target` | datetime | Thoi gian tra phong du kien |
| `number_of_adults` | int | So nguoi lon |
| `number_of_children` | int | So tre em |
| `price_at_booking` | decimal(10,2) | Gia chot tai luc dat |
| `rent_type` | varchar(20) | Loai thue tai luc dat |
| `room_assignment_status` | varchar(20) | `UNASSIGNED`, `ASSIGNED` |
| `assigned_at` | datetime | Thoi gian le tan gan phong |
| `status` | varchar(20) | `PENDING`, `CONFIRMED`, `CHECKED_IN`, `CANCELLED`, `COMPLETED` |

Quy tac ton kho theo loai phong:

```text
so phong con ban duoc cua mot loai phong
= tong so rooms thuoc room_type
- so booking_details cung room_type bi trung thoi gian va status con hieu luc
```

Status con hieu luc nen tinh gom: `PENDING`, `CONFIRMED`, `CHECKED_IN`.

## 5. Xac Thuc Khach Luu Tru Bang CCCD

### `booking_guests`

Luu danh sach nguoi luu tru thuc te trong tung phong/booking detail. Bang nay giai quyet truong hop mot customer dat 1 phong cho 2 nguoi, khi den le tan phai ghi nhan CCCD cua ca 2 nguoi.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `booking_id` | bigint | FK -> `bookings.id` |
| `booking_detail_id` | bigint | FK -> `booking_details.id` |
| `full_name` | varchar(100) | Ho ten tren giay to |
| `identity_document_type` | varchar(20) | Mac dinh `CCCD`, co the mo rong `CMND`, `PASSPORT` |
| `identity_document_number` | varchar(30) | So CCCD/ho chieu |
| `date_of_birth` | date | Ngay sinh |
| `gender` | varchar(20) | Gioi tinh |
| `nationality` | varchar(50) | Mac dinh `VIETNAM` |
| `phone` | varchar(15) | So dien thoai, nullable |
| `address` | varchar(255) | Dia chi theo giay to |
| `is_primary_guest` | boolean | Khach dai dien phong |
| `verified_by_employee_id` | bigint | FK -> `employees.id`, le tan xac thuc |
| `verified_at` | datetime | Thoi gian xac thuc |
| `note` | text | Ghi chu |

Unique constraint de tranh nhap trung giay to trong cung mot phong: `booking_detail_id`, `identity_document_number`.

Quy tac nghiep vu:

- Khach nguoi lon nen bat buoc co giay to.
- Neu `identity_document_type = CCCD`, so giay to nen validate 12 chu so o tang DTO/service.
- Customer khong nen duoc xem day du so CCCD trong public API.
- Le tan/admin moi duoc tao, sua, xem thong tin xac thuc.

## 6. Check-In Va Check-Out

### `check_in_records`

Nhat ky nhan/tra phong thuc te. Check-in chi hop le khi `booking_details.room_id` da duoc gan va danh sach `booking_guests` da duoc xac thuc theo quy dinh.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `booking_detail_id` | bigint | FK -> `booking_details.id`, unique |
| `customer_id` | bigint | FK -> `customers.id`, customer dai dien booking |
| `housekeeping_id` | bigint | FK -> `employees.id`, nullable |
| `receptionist_id` | bigint | FK -> `employees.id`, nullable |
| `actual_check_in` | datetime | Gio check-in thuc te |
| `actual_check_out` | datetime | Gio check-out thuc te |
| `early_check_in_fee` | decimal(10,2) | Phi nhan som |
| `late_check_out_fee` | decimal(10,2) | Phi tra muon |

Luồng check-in de xuat:

1. Le tan mo booking.
2. He thong hien cac `booking_details` chua gan phong.
3. Le tan chon phong vat ly co cung `room_type_id` va dang trong.
4. He thong cap nhat `room_id`, `assigned_by_employee_id`, `assigned_at`, `room_assignment_status = ASSIGNED`.
5. Le tan nhap danh sach `booking_guests` va xac thuc giay to.
6. He thong tao `check_in_records` va doi status sang `CHECKED_IN`.

### `housekeeping_tasks`

Moi dong dai dien cho mot yeu cau kiem tra va don phong cua mot lan luu tru. Task gan theo `check_in_record_id`, khong chi gan theo phong, de minibar va chi phi luon thuoc dung booking detail.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `check_in_record_id` | bigint | FK -> `check_in_records.id`, unique |
| `room_id` | bigint | FK -> `rooms.id` |
| `requested_by_employee_id` | bigint | FK -> `employees.id`, le tan/admin gui yeu cau |
| `assigned_housekeeping_id` | bigint | FK -> `employees.id`, nullable den khi co nguoi nhan viec |
| `inspection_status` | varchar(20) | `PENDING`, `IN_PROGRESS`, `COMPLETED` |
| `cleaning_status` | varchar(20) | `PENDING`, `IN_PROGRESS`, `COMPLETED` |
| `note` | varchar(1000) | Ghi chu tinh trang phong |
| `requested_at` | datetime | Thoi gian le tan gui yeu cau |
| `started_at` | datetime | Thoi gian housekeeping nhan viec |
| `inspection_completed_at` | datetime | Thoi gian chot minibar va gui chi phi cho le tan |
| `cleaning_completed_at` | datetime | Thoi gian don phong xong |
| `version` | bigint | Optimistic lock, ngan hai thiet bi ghi de len nhau |
| `created_at` | datetime | Thoi gian tao |
| `updated_at` | datetime | Thoi gian cap nhat gan nhat |

Unique constraint: `check_in_record_id`.

Luong checkout va don phong:

1. Le tan/admin tao housekeeping task cho phong dang `CHECKED_IN`.
2. Housekeeping nhan task; hai trang thai chuyen sang `IN_PROGRESS`, phong chuyen `OCCUPIED -> CLEANING`.
3. Housekeeping ghi nhan minibar trong `room_amenities_usage` va gui ket qua; `inspection_status = COMPLETED`.
4. Hoa don duoc tinh lai. Le tan co the thu tien va checkout ngay, khong can cho don phong xong.
5. Housekeeping tiep tuc don phong. Khi xac nhan hoan tat, `cleaning_status = COMPLETED` va phong chuyen `CLEANING -> AVAILABLE`.

Dieu kien checkout chi phu thuoc `inspection_status = COMPLETED`. Dieu kien phong san sang don khach moi thuoc `cleaning_status = COMPLETED`; hai moc nay doc lap.

### `housekeeping_checklist_templates`

Luu mau checklist ve sinh mac dinh theo loai phong va checklist ghi de cho tung phong vat ly. `room_id = null` nghia la checklist mac dinh cua `room_type_id`; neu `room_id` co gia tri thi day la checklist tuy chinh cho rieng phong do.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `room_type_id` | bigint | FK -> `room_types.id`, bat buoc |
| `room_id` | bigint | FK -> `rooms.id`, nullable, unique |
| `name` | varchar(120) | Ten checklist |
| `is_active` | boolean | Checklist co dang duoc ap dung hay khong |
| `version` | bigint | Optimistic lock khi hai Admin cung cap nhat |
| `created_at` | datetime | Thoi gian tao |
| `updated_at` | datetime | Thoi gian cap nhat gan nhat |

Quy tac ke thua:

1. Neu phong co template rieng theo `room_id`, he thong dung template rieng.
2. Neu phong khong co template rieng, he thong dung template mac dinh co cung `room_type_id` va `room_id = null`.
3. Khi phong thay doi loai phong, checklist tuy chinh cu duoc xoa de phong ke thua tieu chuan cua loai phong moi.
4. Moi loai phong chi co mot template mac dinh; moi phong chi co toi da mot template tuy chinh.

### `housekeeping_checklist_items`

Luu cac hang muc cong viec thuoc mot checklist. Thu tu trong checklist do `display_order` quyet dinh.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `template_id` | bigint | FK -> `housekeeping_checklist_templates.id` |
| `title` | varchar(200) | Ten hang muc |
| `description` | varchar(500) | Huong dan hoac tieu chuan can dat, nullable |
| `is_required` | boolean | Bat buoc hoan thanh truoc khi dong task |
| `is_active` | boolean | Hang muc co dang duoc ap dung hay khong |
| `display_order` | int | Thu tu hien thi, bat dau tu 1 |

Khi tao `housekeeping_tasks`, checklist hieu luc duoc sao chep sang `housekeeping_task_checklist_items` thay vi doc truc tiep cau hinh moi lan. Cach nay dam bao viec Admin sua checklist khong lam thay doi cong viec dang lam hoac lich su cu.

### `housekeeping_task_checklist_items`

Luu snapshot va ket qua thuc hien tung hang muc cua mot housekeeping task.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK, auto increment |
| `housekeeping_task_id` | bigint | FK -> `housekeeping_tasks.id` |
| `source_template_item_id` | bigint | ID hang muc cau hinh goc, chi dung truy vet, nullable |
| `title_snapshot` | varchar(200) | Ten hang muc tai thoi diem tao task |
| `description_snapshot` | varchar(500) | Huong dan tai thoi diem tao task, nullable |
| `is_required` | boolean | Hang muc bat buoc hay tuy chon |
| `display_order` | int | Thu tu hien thi trong task |
| `is_completed` | boolean | Da hoan thanh hay chua |
| `completed_by_employee_id` | bigint | FK -> `employees.id`, nullable |
| `completed_at` | datetime | Thoi gian xac nhan hoan thanh, nullable |

Unique constraint: `housekeeping_task_id`, `display_order`.

Quy tac hoan tat don phong:

1. Request phai gui day du cac hang muc snapshot cua task, khong chap nhan ID thuoc task khac.
2. Tat ca hang muc `is_required = true` phai duoc hoan thanh.
3. Khi hop le, he thong luu `is_completed`, `completed_by_employee_id`, `completed_at` trong cung transaction voi viec chuyen phong sang `AVAILABLE`.

## 7. Dich Vu Va Phu Phi

### `facility_services`

Dich vu tien ich khong quan ly ton kho.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK |
| `name` | varchar(100) | Ten dich vu |
| `price` | decimal(10,2) | Don gia |
| `is_active` | boolean | Con cung cap hay khong |

### `inventory_services`

Dich vu/hang hoa co quan ly ton kho.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK |
| `name` | varchar(100) | Ten hang hoa/dich vu |
| `price` | decimal(10,2) | Don gia |
| `quantity_in_stock` | int | So luong ton |

### `booking_service_items`

Dich vu khach chon kem khi dat phong, gan theo `booking_detail`.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK |
| `booking_detail_id` | bigint | FK -> `booking_details.id` |
| `facility_service_id` | bigint | FK -> `facility_services.id`, nullable |
| `inventory_service_id` | bigint | FK -> `inventory_services.id`, nullable |
| `quantity` | int | So luong |
| `price_at_booking` | decimal(10,2) | Gia tai luc dat |

### `room_mini_bar_items`

Danh muc hang mini-bar.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK |
| `name` | varchar(100) | Ten mat hang |
| `price` | decimal(10,2) | Don gia |
| `quantity_in_stock` | int | Ton kho |

### `room_amenities_usage`

Ghi nhan hang mini-bar da su dung khi khach luu tru.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK |
| `check_in_record_id` | bigint | FK -> `check_in_records.id` |
| `item_id` | bigint | FK -> `room_mini_bar_items.id` |
| `quantity_used` | int | So luong da dung |

### `service_usages`

Nhat ky dich vu phat sinh trong qua trinh luu tru.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK |
| `check_in_record_id` | bigint | FK -> `check_in_records.id` |
| `facility_service_id` | bigint | FK -> `facility_services.id`, nullable |
| `inventory_service_id` | bigint | FK -> `inventory_services.id`, nullable |
| `quantity` | int | So luong |
| `price_at_use` | decimal(10,2) | Gia tai luc dung |

## 8. Noi Quy, Phat Va Hoa Don

### `rules_penalties`

Danh muc noi quy va muc phat mac dinh.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK |
| `title` | varchar(255) | Ten loi/quy dinh |
| `penalty_amount` | decimal(10,2) | Muc phat mac dinh |

### `applied_penalties`

Bien ban phat thuc te khi check-out.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK |
| `check_record_id` | bigint | FK -> `check_in_records.id` |
| `rules_penalty_id` | bigint | FK -> `rules_penalties.id` |
| `actual_fine` | decimal(10,2) | So tien phat thuc te |
| `description` | varchar(255) | Ghi chu |

### `invoices`

Hoa don tong cho booking.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK |
| `booking_id` | bigint | FK -> `bookings.id`, unique |
| `employee_id` | bigint | FK -> `employees.id`, nullable |
| `room_charge` | decimal(10,2) | Tong tien phong |
| `penalty_charge` | decimal(10,2) | Tong tien phat |
| `service_charge` | decimal(10,2) | Tong tien dich vu |
| `total_amount` | decimal(10,2) | Tong thanh toan |
| `created_at` | datetime | Ngay lap hoa don |

### `payments`

Lich su thanh toan cua hoa don.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK |
| `invoice_id` | bigint | FK -> `invoices.id` |
| `payment_method` | varchar(20) | `CASH`, `BANK_TRANSFER`, `VNPAY`, `MOMO` |
| `transaction_no` | varchar(100) | Ma giao dich |
| `amount` | decimal(10,2) | So tien |
| `status` | varchar(20) | `PENDING`, `SUCCESS`, `FAILED` |
| `payment_time` | datetime | Thoi gian thanh toan |

## 9. Marketing Va Khuyen Mai

### `vouchers`

Ma giam gia.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK |
| `code` | varchar(20) | Unique |
| `discount_type` | varchar(20) | Loai giam gia |
| `discount_value` | decimal(10,2) | Gia tri giam |
| `min_order_value` | decimal(10,2) | Don toi thieu |
| `max_discount_amount` | decimal(10,2) | Giam toi da |
| `start_date` | datetime | Ngay bat dau |
| `end_date` | datetime | Ngay ket thuc |
| `usage_limit` | int | Gioi han luot dung |
| `used_count` | int | So luot da dung |

### `customer_loyalty`

Diem tich luy customer.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK |
| `customer_id` | bigint | FK -> `customers.id`, unique |
| `current_points` | int | Diem hien co |
| `total_earned_points` | int | Tong diem da tich |

### `ai_agent_configs`

Cau hinh AI Agent marketing.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK |
| `agent_name` | varchar(50) | Ten agent |
| `system_prompt` | text | Prompt he thong |
| `posting_interval_hours` | int | Chu ky dang bai |
| `is_active` | boolean | Trang thai |

### `marketing_posts`

Bai viet marketing do nhan vien hoac AI Agent tao.

| Column | Type | Note |
|---|---|---|
| `id` | bigint | PK |
| `platform` | varchar(20) | Kenh dang |
| `generated_content` | text | Noi dung |
| `media_url` | varchar(255) | Media |
| `scheduled_at` | datetime | Lich dang |
| `posted_at` | datetime | Thoi gian da dang |
| `status` | varchar(20) | Trang thai |
| `external_post_id` | varchar(100) | ID tren nen tang ngoai |
| `creator_id` | bigint | FK -> `employees.id`, nullable |
| `agent_config_id` | bigint | FK -> `ai_agent_configs.id`, nullable |

## 10. Quan He ERD Chinh

```text
roles.id                  1 - N  accounts.role_id
accounts.id               1 - 1  customers.account_id
accounts.id               1 - 1  employees.account_id

deposit_policies.id       1 - N  room_types.deposit_policy_id
room_types.id             1 - N  rooms.room_type_id
rooms.id                  1 - N  room_images.room_id
rooms.id                  1 - N  room_schedules.room_id

room_types.id             1 - N  room_price_configs.room_type_id
price_policies.id         1 - N  room_price_configs.price_policy_id

customers.id              1 - N  bookings.customer_id
deposit_policies.id       1 - N  bookings.deposit_policy_id
bookings.id               1 - N  booking_details.booking_id
room_types.id             1 - N  booking_details.room_type_id
rooms.id                  1 - N  booking_details.room_id
employees.id              1 - N  booking_details.assigned_by_employee_id

bookings.id               1 - N  booking_guests.booking_id
booking_details.id        1 - N  booking_guests.booking_detail_id
employees.id              1 - N  booking_guests.verified_by_employee_id

booking_details.id        1 - 1  check_in_records.booking_detail_id
customers.id              1 - N  check_in_records.customer_id
employees.id              1 - N  check_in_records.housekeeping_id
employees.id              1 - N  check_in_records.receptionist_id

check_in_records.id       1 - 1  housekeeping_tasks.check_in_record_id
rooms.id                  1 - N  housekeeping_tasks.room_id
employees.id              1 - N  housekeeping_tasks.requested_by_employee_id
employees.id              1 - N  housekeeping_tasks.assigned_housekeeping_id

room_types.id             1 - N  housekeeping_checklist_templates.room_type_id
rooms.id                  1 - 0..1 housekeeping_checklist_templates.room_id
housekeeping_checklist_templates.id 1 - N housekeeping_checklist_items.template_id
housekeeping_tasks.id       1 - N  housekeeping_task_checklist_items.housekeeping_task_id
employees.id                1 - N  housekeeping_task_checklist_items.completed_by_employee_id

booking_details.id        1 - N  booking_service_items.booking_detail_id
facility_services.id      1 - N  booking_service_items.facility_service_id
inventory_services.id     1 - N  booking_service_items.inventory_service_id

check_in_records.id       1 - N  service_usages.check_in_record_id
facility_services.id      1 - N  service_usages.facility_service_id
inventory_services.id     1 - N  service_usages.inventory_service_id

check_in_records.id       1 - N  room_amenities_usage.check_in_record_id
room_mini_bar_items.id    1 - N  room_amenities_usage.item_id

check_in_records.id       1 - N  applied_penalties.check_record_id
rules_penalties.id        1 - N  applied_penalties.rules_penalty_id

bookings.id               1 - 1  invoices.booking_id
employees.id              1 - N  invoices.employee_id
invoices.id               1 - N  payments.invoice_id

customers.id              1 - 1  customer_loyalty.customer_id
ai_agent_configs.id       1 - N  marketing_posts.agent_config_id
employees.id              1 - N  marketing_posts.creator_id
```
