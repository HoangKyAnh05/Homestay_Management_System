import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        page.on('console', lambda msg: print('BROWSER CONSOLE:', msg.text))
        page.on('pageerror', lambda err: print('BROWSER ERROR:', err))

        await page.goto('http://localhost:5173/landing', wait_until='networkidle')
        await asyncio.sleep(2)
        
        root_html = await page.evaluate('() => document.getElementById("root").innerHTML')
        print('Root innerHTML length:', len(root_html))
        print('Root preview:', root_html[:400])
        
        await browser.close()

asyncio.run(main())
