import asyncio
from playwright.async_api import async_playwright

async def test_nav():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1707, 'height': 825})
        page = await context.new_page()
        await page.goto('http://localhost:5173/landing', wait_until='networkidle')
        await page.wait_for_timeout(2000)
        
        # Click on 'Trải Nghiệm'
        await page.click('a[href="#experiences"]')
        await page.wait_for_timeout(800)
        await page.screenshot(path='landing_screenshots/nav_01_experiences_click.png')
        print('Captured nav_01_experiences_click.png')
        
        # Click on 'Góc Sống Ảo 3D'
        await page.click('a[href="#showroom"]')
        await page.wait_for_timeout(800)
        await page.screenshot(path='landing_screenshots/nav_02_showroom_click.png')
        print('Captured nav_02_showroom_click.png')
        
        # Click on 'Vị Trí'
        await page.click('a[href="#location"]')
        await page.wait_for_timeout(800)
        await page.screenshot(path='landing_screenshots/nav_03_location_click.png')
        print('Captured nav_03_location_click.png')
        
        print('All done!')
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_nav())
