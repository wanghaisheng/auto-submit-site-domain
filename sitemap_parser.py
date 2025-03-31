from dotenv import load_dotenv
import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

load_dotenv()  # Load environment variables

MAX_URLS = int(os.getenv('MAX_URLS_PER_RUN', 100))  # Default to 100 if not set

def parse_sitemaps():
    with open('domains.txt', 'r') as f:
        domains = [line.strip() for line in f.readlines()]
    
    urls = []
    for domain in domains:
        try:
            sitemap_url = urljoin(f'https://{domain}', 'sitemap.xml')
            response = requests.get(sitemap_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'xml')
            for loc in soup.find_all('loc'):
                url = loc.text.strip()
                if url.startswith('http'):
                    urls.append(url)
        except Exception as e:
            print(f"Error processing {domain}: {e}")
    
    urls = urls[:MAX_URLS]  # Limit to configured maximum
    with open('urls.txt', 'w') as f:
        f.write('\n'.join(urls))

if __name__ == '__main__':
    parse_sitemaps()