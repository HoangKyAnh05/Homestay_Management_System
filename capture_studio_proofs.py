import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    os.makedirs("studio_proofs", exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1707, "height": 900})
        page = await context.new_page()
        
        print("Navigating to http://localhost:5173/landing ...")
        await page.goto("http://localhost:5173/landing", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        
        # 1. Click anywhere to verify Click Ripple
        await page.mouse.click(800, 400)
        await page.wait_for_timeout(100)
        await page.screenshot(path="studio_proofs/01_hero_live_hud.png")
        print("Captured 01_hero_live_hud.png")
        
        # 2. Scroll to Dual Marquee & Atmosphere Simulator
        sim_card = page.locator(".atmosphere-simulator-card")
        if await sim_card.count() > 0:
            await sim_card.scroll_into_view_if_needed()
            await page.wait_for_timeout(1000)
            
            # Click Sunset button on simulator
            sunset_btn = page.locator('.atmosphere-simulator-card [data-mood="sunset"]')
            if await sunset_btn.count() > 0:
                await sunset_btn.click()
                await page.wait_for_timeout(800)
                
            await page.screenshot(path="studio_proofs/02_dual_marquee_and_simulator.png")
            print("Captured 02_dual_marquee_and_simulator.png")
            
        # 3. Hover showroom card
        first_card = page.locator(".showroom-card-3d").first
        if await first_card.count() > 0:
            await first_card.scroll_into_view_if_needed()
            await page.wait_for_timeout(500)
            await first_card.hover()
            await page.wait_for_timeout(500)
            await page.screenshot(path="studio_proofs/03_showroom_cards_tilt.png")
            print("Captured 03_showroom_cards_tilt.png")
            
        # 4. Scroll to Scenery articles
        scenery_sec = page.locator("#panorama-section")
        if await scenery_sec.count() > 0:
            await scenery_sec.scroll_into_view_if_needed()
            await page.wait_for_timeout(1000)
            await page.screenshot(path="studio_proofs/04_scenery_and_veil.png")
            print("Captured 04_scenery_and_veil.png")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
