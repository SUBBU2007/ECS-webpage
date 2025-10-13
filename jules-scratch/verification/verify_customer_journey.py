from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Navigate to the customer portal
            page.goto("http://localhost:5173/customer")

            # Wait for the counter selection dropdown to be available
            page.wait_for_selector('button:has-text("Select a Counter")', timeout=10000)

            # Click the dropdown to open it
            page.click('button:has-text("Select a Counter")')

            # Click the first counter in the list (e.g., "General Inquiry")
            page.click('div[role="menuitem"]:has-text("General Inquiry")')

            # Click the "Get Token" button
            get_token_button = page.locator('button:has-text("Get Token")')
            expect(get_token_button).to_be_enabled(timeout=5000)
            get_token_button.click()

            # Wait for the token card to appear
            expect(page.locator('div:has-text("Your Token for")')).to_be_visible(timeout=10000)

            # Take a screenshot
            page.screenshot(path="jules-scratch/verification/verification.png")
            print("Screenshot taken successfully.")

        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
