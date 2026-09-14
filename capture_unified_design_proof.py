import os
import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8', errors='ignore')

BASE_URL = "https://homestay-sapa.myvnc.com"
OUTPUT_DIR = r"d:\Work_Code_22_26\SEP490\Homestay_Management_System\reports\ui_audit"
SCREENSHOTS_DIR = os.path.join(OUTPUT_DIR, "screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

print("==================================================================")
print("🚀 BẮT ĐẦU CHỤP ẢNH MINH CHỨNG DESIGN SYSTEM ĐỒNG BỘ TOÀN DIỆN")
print("==================================================================")

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--window-size=1600,900']
    )

    # 1. Customer Context
    cust_ctx = browser.new_context(viewport={'width': 1440, 'height': 900}, ignore_https_errors=True)
    cust_page = cust_ctx.new_page()

    # Login Customer first
    cust_page.goto(f"{BASE_URL}/login", timeout=25000)
    time.sleep(1)
    cust_page.fill('input[type="email"]', 'customer.an@example.com')
    cust_page.fill('input[type="password"]', '123456')
    cust_page.click('button[type="submit"]')
    time.sleep(2)

    # Capture Customer Screens
    screens = [
        ("unified_customer_home.png", f"{BASE_URL}/home"),
        ("unified_customer_rooms.png", f"{BASE_URL}/rooms"),
        ("unified_customer_room_detail.png", f"{BASE_URL}/rooms/1"),
        ("unified_customer_booking_history.png", f"{BASE_URL}/booking-history"),
        ("unified_customer_stay_portal.png", f"{BASE_URL}/stay"),
        ("unified_customer_amenities.png", f"{BASE_URL}/amenities"),
        ("unified_customer_giveaway.png", f"{BASE_URL}/giveaway"),
    ]

    for filename, url in screens:
        try:
            cust_page.goto(url, timeout=25000)
            time.sleep(2)
            cust_page.screenshot(path=os.path.join(SCREENSHOTS_DIR, filename))
            print(f"✓ Captured: {filename}")
        except Exception as e:
            print(f"✗ Failed {filename}: {e}")

    # 2. Admin Context
    admin_ctx = browser.new_context(viewport={'width': 1440, 'height': 900}, ignore_https_errors=True)
    admin_page = admin_ctx.new_page()

    # Login Admin
    admin_page.goto(f"{BASE_URL}/admin/login", timeout=25000)
    time.sleep(1)
    admin_page.fill('#admin-email', 'admin@example.com')
    admin_page.fill('#admin-password', '123456')
    admin_page.click('button[type="submit"]')
    time.sleep(2)

    admin_screens = [
        ("unified_admin_dashboard.png", f"{BASE_URL}/admin"),
        ("unified_admin_bookings.png", f"{BASE_URL}/admin/bookings"),
        ("unified_admin_checkin_logs.png", f"{BASE_URL}/admin/check-in-logs"),
        ("unified_admin_housekeeping_calendar.png", f"{BASE_URL}/admin/housekeeping/room-calendar"),
        ("unified_admin_housekeeping_tasks.png", f"{BASE_URL}/admin/housekeeping/tasks"),
        ("unified_admin_invoices.png", f"{BASE_URL}/admin/invoices"),
        ("unified_admin_users.png", f"{BASE_URL}/admin/users"),
        ("unified_admin_rules_penalties.png", f"{BASE_URL}/admin/rules-penalties"),
        ("unified_admin_vouchers.png", f"{BASE_URL}/admin/marketing/vouchers"),
        ("unified_admin_marketing_ai.png", f"{BASE_URL}/admin/marketing/ai-agent"),
    ]

    for filename, url in admin_screens:
        try:
            admin_page.goto(url, timeout=25000)
            time.sleep(2)
            admin_page.screenshot(path=os.path.join(SCREENSHOTS_DIR, filename))
            print(f"✓ Captured: {filename}")
        except Exception as e:
            print(f"✗ Failed {filename}: {e}")

    browser.close()

print("==================================================================")
print("🎉 ĐÃ HOÀN TẤT CHỤP ẢNH TẤT CẢ MÀN HÌNH ĐỒNG BỘ DESIGN SYSTEM!")
print("==================================================================")
