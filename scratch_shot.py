
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        await page.goto('http://localhost:5173/landing', wait_until='networkidle')
        await asyncio.sleep(2)
        await page.screenshot(path='landing_hero_live.png', full_page=False)
        print('Screenshot saved successfully')
        await browser.close()

asyncio.run(main())
