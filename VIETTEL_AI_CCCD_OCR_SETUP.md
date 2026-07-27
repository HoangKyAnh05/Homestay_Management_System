# Huong dan cau hinh doc can cuoc cong dan bang Viettel AI

Tai lieu nay huong dan cau hinh chuc nang `Mat truoc` / `Mat sau` CCCD tren man hinh check-in. He thong se gui hai anh len Viettel AI OCR de boc tach thong tin giay to tuy than va tu dien form nguoi luu tru.

## API Viettel AI dang dung

Theo tai lieu ban cung cap:

```text
POST https://viettelai.vn/ocr/id_card
Content-Type: multipart/form-data
accept: */*
```

Body multipart:

```text
image_front = File anh mat truoc
image_back  = File anh mat sau
token       = Token lay tai https://viettelai.vn/dashboard/token
```

Response thanh cong co dang:

```json
{
  "code": 1,
  "message": "Good.",
  "request_id": "...",
  "information": {
    "id": "001...",
    "name": "NGUYEN VAN A",
    "birthday": "01/01/1990",
    "sex": "Nam",
    "address": "...",
    "nationality": "Vietnam",
    "issue_date": "01/01/2021",
    "issue_by": "..."
  }
}
```

He thong map cac truong sau vao form check-in:

| Viettel AI | Form check-in |
| --- | --- |
| `name` | Ho va ten |
| `id` | Can cuoc cong dan |
| `birthday` | Ngay sinh |
| `sex` | Gioi tinh |
| `nationality` | Quoc tich |
| `address` | Dia chi |
| `issue_date` | Ngay cap, hien chua hien tren form |
| `issue_by` | Noi cap, hien chua hien tren form |

## Buoc 1: Dang ky va lay token Viettel AI

1. Truy cap https://viettelai.vn/.
2. Dang ky hoac dang nhap tai khoan.
3. Vao dashboard/token: https://viettelai.vn/dashboard/token.
4. Tao hoac copy token API.
5. Kiem tra tai khoan/goi dich vu co quyen dung API:
   `API OCR - Boc tach thong tin Giay to tuy than`.

## Buoc 2: Cau hinh backend

Mo file cau hinh local cua backend, thuong la:

```text
homestayManagement/.env
```

Them hoac cap nhat:

```properties
IDENTITY_OCR_VIETTEL_ENABLED=true
IDENTITY_OCR_VIETTEL_ENDPOINT=https://viettelai.vn/ocr/id_card
IDENTITY_OCR_VIETTEL_TOKEN=your_viettel_ai_token
IDENTITY_OCR_VIETTEL_TIMEOUT_SECONDS=20
IDENTITY_OCR_VIETTEL_MAX_FILE_MB=8
```

Khong commit token len Git.

## Buoc 3: Khoi dong lai backend

```powershell
cd D:\do_an\Homestay_Management_System\homestayManagement
mvn spring-boot:run
```

Neu ban dung Maven wrapper va wrapper hoat dong binh thuong:

```powershell
.\mvnw.cmd spring-boot:run
```

## Buoc 4: Kiem thu tren man hinh check-in

1. Dang nhap bang tai khoan admin hoac le tan.
2. Vao `Quan li dat va tra phong` -> `Nhat ky luu tru`.
3. Chon booking can check-in.
4. Bam `Check-in`.
5. Tai tung `Nguoi luu tru`, chon/chup:
   - `Mat truoc`
   - `Mat sau`
6. Sau khi du ca hai mat, he thong tu goi Viettel AI OCR.
7. Kiem tra cac truong da duoc dien:
   - Ho va ten.
   - CCCD.
   - Ngay sinh.
   - Gioi tinh.
   - Quoc tich.
   - Dia chi.
8. Sua lai neu OCR doc sai, sau do bam `Xac nhan check-in`.

## Loi thuong gap

### Chua bat cau hinh OCR

Kiem tra:

```properties
IDENTITY_OCR_VIETTEL_ENABLED=true
```

Sau do khoi dong lai backend.

### Chua cau hinh token

Kiem tra:

```properties
IDENTITY_OCR_VIETTEL_TOKEN=your_viettel_ai_token
```

Token lay tai https://viettelai.vn/dashboard/token.

### Viettel AI tra ve code 106

`106` nghia la token khong hop le. Hay tao/copy lai token tren dashboard Viettel AI.

### Viettel AI tra ve code 160

`160` nghia la thieu anh giay to. Man hinh check-in can du ca `Mat truoc` va `Mat sau`.

### Viettel AI tra ve code 209

`209` nghia la anh sai dinh dang. Hay dung file `jpg`, `jpeg` hoac `png`.

### Viettel AI tra ve code 261

`261` nghia la khong co giay to tuy than trong anh. Hay chup lai CCCD ro net, nam tron trong khung hinh, khong bi che sang.

## Luu y bao mat

- Backend moi la noi goi Viettel AI, frontend khong biet token.
- Anh CCCD khong duoc luu vao database trong luong hien tai.
- Chi role `ADMIN` va `RECEPTIONIST` duoc goi endpoint OCR vi endpoint nam trong `/api/admin/bookings/**`.
- Le tan van phai kiem tra lai thong tin OCR truoc khi xac nhan check-in.
- Neu sau nay can luu anh CCCD, can bo sung ma hoa, phan quyen xem anh, va chinh sach thoi gian luu.
