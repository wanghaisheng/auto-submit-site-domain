from dotenv import load_dotenv
import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import time
import re

load_dotenv()  # Load environment variables

MAX_URLS = int(os.getenv('MAX_URLS_PER_RUN', 100))  # Default to 100 if not set
REQUEST_DELAY = int(os.getenv('REQUEST_DELAY', 2))  # Delay between requests

def is_sitemap_url(url):
    """Check if a URL is likely a sitemap based on its name or extension"""
    return 'sitemap' in url.lower() or url.endswith('.xml')

def extract_urls_from_sitemap(sitemap_url, visited_sitemaps=None, all_urls=None):
    """Recursively extract URLs from sitemaps, including nested sitemaps"""
    if visited_sitemaps is None:
        visited_sitemaps = set()
    if all_urls is None:
        all_urls = set()
    
    if sitemap_url in visited_sitemaps:
        return all_urls
    
    visited_sitemaps.add(sitemap_url)
    
    try:
        response = requests.get(sitemap_url, timeout=15)
        response.raise_for_status()
        
        # Check if it's a gzipped sitemap
        if sitemap_url.endswith('.gz'):
            import gzip
            from io import BytesIO
            content = gzip.GzipFile(fileobj=BytesIO(response.content)).read()
            soup = BeautifulSoup(content, 'xml')
        else:
            soup = BeautifulSoup(response.text, 'xml')
        
        # Check for sitemap index
        sitemaps = soup.find_all('sitemap')
        if sitemaps:
            for sitemap in sitemaps:
                loc = sitemap.find('loc')
                if loc:
                    nested_sitemap_url = loc.text.strip()
                    time.sleep(REQUEST_DELAY)  # Be nice to the server
                    extract_urls_from_sitemap(nested_sitemap_url, visited_sitemaps, all_urls)
        
        # Extract URLs from regular sitemap
        for loc in soup.find_all('loc'):
            url = loc.text.strip()
            if url.startswith('http'):
                if is_sitemap_url(url) and url not in visited_sitemaps:
                    time.sleep(REQUEST_DELAY)
                    extract_urls_from_sitemap(url, visited_sitemaps, all_urls)
                else:
                    all_urls.add(url)
    
    except Exception as e:
        print(f"Error processing sitemap {sitemap_url}: {e}")
    
    return all_urls

def find_sitemap_urls(domain):
    """Try different common sitemap locations"""
    sitemap_paths = [
        'sitemap.xml',
        'sitemap_index.xml',
        'sitemap/sitemap.xml',
        'wp-sitemap.xml',
        'sitemaps/sitemap.xml'
    ]
    
    found_sitemaps = []
    
    # First try robots.txt to find sitemap
    try:
        robots_url = f'https://{domain}/robots.txt'
        response = requests.get(robots_url, timeout=10)
        if response.status_code == 200:
            # Look for Sitemap: directive in robots.txt
            for line in response.text.splitlines():
                if line.lower().startswith('sitemap:'):
                    sitemap_url = line.split(':', 1)[1].strip()
                    found_sitemaps.append(sitemap_url)
    except Exception as e:
        print(f"Error checking robots.txt for {domain}: {e}")
    
    # Try common sitemap locations
    for path in sitemap_paths:
        sitemap_url = urljoin(f'https://{domain}/', path)
        try:
            response = requests.head(sitemap_url, timeout=5)
            if response.status_code == 200:
                found_sitemaps.append(sitemap_url)
        except Exception:
            pass
        time.sleep(REQUEST_DELAY)
    
    return found_sitemaps

def parse_sitemaps():
    with open('domains.txt', 'r') as f:
        domains = [line.strip() for line in f.readlines()]
    
    all_urls = set()
    processed_domains = 0
    
    for domain in domains:
        try:
            print(f"Processing domain: {domain}")
            sitemap_urls = find_sitemap_urls(domain)
            
            if not sitemap_urls:
                print(f"No sitemap found for {domain}, trying homepage for links")
                # If no sitemap found, try to extract links from homepage
                try:
                    home_url = f'https://{domain}/'
                    response = requests.get(home_url, timeout=15)
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')
                        for a_tag in soup.find_all('a', href=True):
                            link = a_tag['href']
                            if link.startswith('http'):
                                all_urls.add(link)
                            elif not link.startswith('#') and not link.startswith('javascript:'):
                                full_url = urljoin(home_url, link)
                                all_urls.add(full_url)
                except Exception as e:
                    print(f"Error extracting links from homepage of {domain}: {e}")
            
            # Process each found sitemap
            for sitemap_url in sitemap_urls:
                print(f"Processing sitemap: {sitemap_url}")
                extract_urls_from_sitemap(sitemap_url, set(), all_urls)
                time.sleep(REQUEST_DELAY)
            
            processed_domains += 1
            print(f"Processed {processed_domains}/{len(domains)} domains, found {len(all_urls)} URLs so far")
            
        except Exception as e:
            print(f"Error processing {domain}: {e}")
    
    # Convert to list and limit to configured maximum
    urls_list = list(all_urls)
    if MAX_URLS > 0:
        urls_list = urls_list[:MAX_URLS]
    
    print(f"Total unique URLs found: {len(all_urls)}")
    print(f"Saving {len(urls_list)} URLs to file")
    
    with open('urls.txt', 'w') as f:
        f.write('\n'.join(urls_list))

if __name__ == '__main__':
    parse_sitemaps()