import asyncio
import os
from playwright.async_api import async_playwright

async def capture():
    output_dir = r"d:\Work_Code_22_26\SEP490\Homestay_Management_System\studio_proofs"
    os.makedirs(output_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 1080})
        page = await context.new_page()
        
        print("Navigating to http://localhost:5173/landing...")
        await page.goto("http://localhost:5173/landing", wait_until="networkidle")
        await asyncio.sleep(2)
        
        # 1. Landing Page with prominent Header & Hero
        hero_path = os.path.join(output_dir, "landing_with_zen_header.png")
        await page.screenshot(path=hero_path)
        print("Captured:", hero_path)
        
        # 2. Scroll to experiences section
        exp_el = await page.query_selector("#experiences")
        if exp_el:
            await exp_el.scroll_into_view_if_needed()
            await asyncio.sleep(1)
            exp_path = os.path.join(output_dir, "landing_experiences_section.png")
            await page.screenshot(path=exp_path)
            print("Captured:", exp_path)
            
        # 3. Click the "✨ Thả Hồn 4K" header button to open Cinema Zen Sanctuary Mode
        header_btn = await page.query_selector("#header-zen-btn")
        if header_btn:
            print("Clicking Header Zen Button...")
            await header_btn.click()
            await asyncio.sleep(2)
            zen_path = os.path.join(output_dir, "cinema_zen_mode_dawn.png")
            await page.screenshot(path=zen_path)
            print("Captured Zen Dawn:", zen_path)
            
            # Switch to Sunset scene
            sunset_btn = await page.query_selector("button.zen-scene-pill-btn:nth-child(2)")
            if sunset_btn:
                await sunset_btn.click()
                await asyncio.sleep(1.5)
                sunset_path = os.path.join(output_dir, "cinema_zen_mode_sunset.png")
                await page.screenshot(path=sunset_path)
                print("Captured Zen Sunset:", sunset_path)
                
            # Toggle Sound Mixer panel
            mixer_toggle = await page.query_selector("button.zen-mixer-toggle-btn")
            if mixer_toggle:
                await mixer_toggle.click()
                await asyncio.sleep(1)
                mixer_path = os.path.join(output_dir, "cinema_zen_sound_mixer.png")
                await page.screenshot(path=mixer_path)
                print("Captured Zen Sound Mixer:", mixer_path)
                
            # Toggle Breathing modal
            breath_btn = await page.query_selector("button.zen-glass-pill-btn")
            if breath_btn:
                await breath_btn.click()
                await asyncio.sleep(1)
                breath_path = os.path.join(output_dir, "cinema_zen_breathing_guide.png")
                await page.screenshot(path=breath_path)
                print("Captured Zen Breathing Guide:", breath_path)

        await browser.close()
        print("All screenshots successfully captured!")

if __name__ == "__main__":
    asyncio.run(capture())
