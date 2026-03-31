from playwright.sync_api import sync_playwright
import os
import time

def run_cuj(page):
    # 1. Dashboard and Admin - Setup Asset
    print("Navigating to Admin...")
    page.goto("http://localhost:3000/admin")
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/admin_page.png")

    page.get_by_placeholder("ex: BOMBA-01").fill("BOMBA-01")
    page.wait_for_timeout(500)
    page.get_by_placeholder("ex: Bomba de Recalque").fill("Bomba de Recalque Alpha")
    page.wait_for_timeout(500)
    page.get_by_role("button", name="Adicionar Ativo").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/asset_added.png")

    # 2. Go back to Dashboard
    print("Going back to Dashboard...")
    page.get_by_role("link").first.click() # Click back arrow
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/dashboard.png")

    # 3. Scanner Flow
    print("Starting Scanner flow...")
    page.get_by_role("link", name="Iniciar Nova OS").click()
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/scanner_idle.png")

    # Simulate Scan
    print("Simulating QR Scan...")
    page.get_by_role("button", name="SIMULAR SCAN (BOMBA-01)").click()
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/asset_identified.png")

    # 4. Voice Recording simulation (UI state change)
    print("Simulating Voice Recording...")
    # In a headless environment we can't easily simulate long press, but we can trigger the state
    page.mouse.move(page.viewport_size['width']/2, page.viewport_size['height'] - 100)
    page.mouse.down()
    page.wait_for_timeout(3000)
    page.mouse.up()

    # Wait for processing and redirect
    print("Waiting for AI processing...")
    page.wait_for_timeout(8000)
    page.screenshot(path="/home/jules/verification/screenshots/dashboard_with_draft.png")

    # 5. Review and Approve
    print("Reviewing Draft...")
    page.get_by_text("Bomba de Recalque Alpha").first.click()
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/screenshots/review_modal.png")

    print("Approving OS...")
    page.get_by_role("button", name="Confirmar Envio").click()
    page.wait_for_timeout(3000)
    page.screenshot(path="/home/jules/verification/screenshots/final_dashboard.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={'width': 390, 'height': 844}, # iPhone 12 Pro size
            is_mobile=True
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
