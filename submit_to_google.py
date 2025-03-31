from DrissionPage import ChromiumPage
import time
import os

def submit_to_google():
    page = ChromiumPage()
    with open('urls.txt', 'r') as f:
        urls = [line.strip() for line in f.readlines()]
    
    for i, url in enumerate(urls, 1):
        try:
            search_url = f"https://www.google.com/search?q=site:{url}"
            page.get(search_url)
            print(f"Submitted: {url}")
            
            if i % 10 == 0:
                time.sleep(60)  # Rate limiting
            else:
                time.sleep(5)
                
        except Exception as e:
            print(f"Failed to submit {url}: {e}")

if __name__ == '__main__':
    submit_to_google()