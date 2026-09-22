import asyncio
import os
from playwright.async_api import async_playwright

async def capture_sections():
    output_dir = os.path.abspath("landing_screenshots")
    os.makedirs(output_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1600, 'height': 920},
            device_scale_factor=1.25
        )
        page = await context.new_page()
        
        print("Navigating to http://localhost:5173/landing...")
        await page.goto("http://localhost:5173/landing", wait_until="networkidle")
        await asyncio.sleep(2)
        
        # 1. Top Hero Section
        await page.evaluate("window.scrollTo(0, 0)")
        await asyncio.sleep(1)
        hero_path = os.path.join(output_dir, "01_landing_hero_section.png")
        await page.screenshot(path=hero_path)
        print(f"Captured 1: {hero_path}")
        
        # 2. Virtual Showroom 3D Section (Header + Cards)
        await page.evaluate("""
            const el = document.getElementById('showroom');
            if (el) {
                const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top: y, behavior: 'instant' });
            }
        """)
        await asyncio.sleep(1.5)
        showroom_path = os.path.join(output_dir, "02_landing_showroom_3d.png")
        await page.screenshot(path=showroom_path)
        print(f"Captured 2: {showroom_path}")
        
        # 3. Experiences Section (Trải nghiệm độc bản Sa Pa)
        await page.evaluate("""
            const el = document.getElementById('experiences');
            if (el) {
                const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top: y, behavior: 'instant' });
            }
        """)
        await asyncio.sleep(1.5)
        exp_path = os.path.join(output_dir, "03_landing_experiences.png")
        await page.screenshot(path=exp_path)
        print(f"Captured 3: {exp_path}")
            
        # 4. Scenery Articles & Food Guide (Cẩm nang du lịch & ẩm thực Sa Pa)
        await page.evaluate("""
            const el = document.getElementById('panorama-section');
            if (el) {
                const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top: y, behavior: 'instant' });
            }
        """)
        await asyncio.sleep(1.5)
        panorama_path = os.path.join(output_dir, "04_landing_sapa_guide_articles.png")
        await page.screenshot(path=panorama_path)
        print(f"Captured 4: {panorama_path}")
            
        await browser.close()
        print("Done capturing perfected screenshots!")

if __name__ == "__main__":
    asyncio.run(capture_sections())
