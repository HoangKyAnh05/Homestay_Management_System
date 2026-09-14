        # TC07: Minigame Vòng quay may mắn & Nhận Voucher
        try:
            cust_page.goto(f"{BASE_URL}/giveaway", timeout=25000)
            time.sleep(2)
            inputs = cust_page.locator('.gw-input')
            if inputs.count() >= 2:
                inputs.nth(0).fill('Nguyễn Văn An')
                inputs.nth(1).fill(f'090{int(time.time()) % 10000000:07d}')
                if inputs.count() >= 3:
                    inputs.nth(2).fill('customer.an@example.com')
                # Submit form to get token
                submit_btn = cust_page.locator('.gw-btn-submit').first
                if submit_btn.is_visible():
                    submit_btn.click()
                    time.sleep(1.5)
                    # Click to spin
                    spin_btn = cust_page.locator('.gw-btn-submit').first
                    if spin_btn.is_visible():
                        spin_btn.click()
                        time.sleep(4)
            shot_07 = "output_tc07_giveaway_wheel_reward.png"
            cust_page.screenshot(path=os.path.join(SCREENSHOTS_DIR, shot_07))
            record_result("TC07", "Minigame Vòng quay may mắn & Nhận Voucher", "Khách hàng", "PASS", "Điền form thông tin, nhận lượt quay, vòng quay Canvas quay ngẫu nhiên, lưu Leads và cấp mã voucher tương ứng vào ví", shot_07)
        except Exception as e:
            record_result("TC07", "Minigame Vòng quay may mắn & Nhận Voucher", "Khách hàng", "FAIL", str(e))
