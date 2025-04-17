"""
Automate submission of a site to Bing Webmaster Tools PubHub using DrissionPage.
- Prompts for login if not already authenticated.
- Navigates to PubHub submission page.
- Submits the provided site URL.

Requirements:
- drissionpage

Usage:
    python scripts/submit_to_bing_pubhub.py --site_url https://38smile.heytcm.com/
"""
import time
import argparse
from DrissionPage import ChromiumPage, Actions

PUBHUB_URL = 'https://www.bing.com/webmasters/pubhub'


def login_if_needed(page: ChromiumPage):
    # If not logged in, Bing will redirect to login page
    if 'login' in page.url or 'account.microsoft.com' in page.url:
        print('Please log in to your Bing/Microsoft account in the opened browser window.')
        input('After logging in and seeing the PubHub page, press Enter to continue...')
        page.get(PUBHUB_URL)
        time.sleep(3)


def submit_site(page: ChromiumPage, site_url: str):
    print(f'Navigating to PubHub: {PUBHUB_URL}')
    page.get(PUBHUB_URL)
    time.sleep(3)
    login_if_needed(page)
    time.sleep(2)

    # Find the input for site URL
    print('Locating site URL input...')
    input_box = page.ele('xpath://input[contains(@placeholder,"siteUrl")]')
    if not input_box:
        input_box = page.ele('xpath://input[@id="siteUrl"]')
    if not input_box:
        raise Exception('Could not find the site URL input box. The page structure may have changed.')
    input_box.input(site_url)
    time.sleep(1)

    # Find and click the submit button
    print('Locating and clicking submit button...')
    submit_btn = page.ele('xpath://button[contains(@type,"submit")]')
    if not submit_btn:
        submit_btn = page.ele('xpath://button[contains(text(),"Submit") or contains(text(),"提交")]')
    if not submit_btn:
        raise Exception('Could not find the submit button. The page structure may have changed.')
    submit_btn.click()
    print('Submission attempted. Check browser for confirmation or errors.')


def main():
    parser = argparse.ArgumentParser(description='Submit a site to Bing PubHub using DrissionPage.')
    parser.add_argument('--site_url', required=True, help='The site URL to submit to Bing PubHub.')
    args = parser.parse_args()

    page = ChromiumPage()
    try:
        submit_site(page, args.site_url)
        print('Done.')
    finally:
        input('Press Enter to close the browser...')
        page.close()


if __name__ == '__main__':
    main()
