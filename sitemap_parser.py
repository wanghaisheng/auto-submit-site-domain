from dotenv import load_dotenv
import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import time
import re
import json
from pathlib import Path

load_dotenv()  # Load environment variables

# Default to 100 if not set - this will be used as the total URL limit across all domains
TOTAL_URL_LIMIT = int(os.getenv('TOTAL_URL_LIMIT', 10000))  
REQUEST_DELAY = int(os.getenv('REQUEST_DELAY', 2))  # Delay between requests

def load_config():
    """Load configuration from config.json"""
    config_path = Path('config.json')
    if config_path.exists():
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print("Error reading config file. Using default configuration.")
    
    # Default configuration
    return {
        "domain_whitelist": [],
        "domain_blacklist": [],
        "use_domain_file": False,
        "domain_file_path": "domains_list.txt",
        "url_limit_per_domain": 1000,
        "total_url_limit": 10000,  # New parameter for total URL limit across all domains
        "submit_not_indexed": True,
        "submit_sitemap": True,
        "split_large_domains": False,
        "max_urls_per_piece": 10000
    }

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
    # Load configuration
    config = load_config()
    url_limit_per_domain = config.get("url_limit_per_domain", 1000)
    total_url_limit = config.get("total_url_limit", TOTAL_URL_LIMIT)
    
    with open('domains.txt', 'r') as f:
        domains = [line.strip() for line in f.readlines()]
    
    all_urls = []
    domain_url_map = {}  # Map domains to their URLs
    processed_domains = 0
    
    for domain in domains:
        # Check if we've already reached the total URL limit
        if total_url_limit > 0 and len(all_urls) >= total_url_limit:
            print(f"Reached total URL limit of {total_url_limit}. Stopping.")
            break
            
        try:
            print(f"Processing domain: {domain}")
            domain_urls = set()
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
                                domain_urls.add(link)
                            elif not link.startswith('#') and not link.startswith('javascript:'):
                                full_url = urljoin(home_url, link)
                                domain_urls.add(full_url)
                except Exception as e:
                    print(f"Error extracting links from homepage of {domain}: {e}")
            
            # Process each found sitemap
            for sitemap_url in sitemap_urls:
                print(f"Processing sitemap: {sitemap_url}")
                extract_urls_from_sitemap(sitemap_url, set(), domain_urls)
                time.sleep(REQUEST_DELAY)
            
            # Apply URL limit per domain if configured
            domain_urls_list = list(domain_urls)
            if url_limit_per_domain > 0 and len(domain_urls_list) > url_limit_per_domain:
                print(f"Limiting URLs for {domain} to {url_limit_per_domain} (from {len(domain_urls_list)})")
                domain_urls_list = domain_urls_list[:url_limit_per_domain]
            
            domain_url_map[domain] = domain_urls_list
            
            # Add URLs to all_urls, respecting the total URL limit
            if total_url_limit > 0:
                # Calculate how many more URLs we can add without exceeding the limit
                remaining_capacity = total_url_limit - len(all_urls)
                if remaining_capacity <= 0:
                    # We've already reached the limit
                    continue
                elif len(domain_urls_list) > remaining_capacity:
                    # We can only add some of the URLs from this domain
                    print(f"Adding {remaining_capacity} of {len(domain_urls_list)} URLs from {domain} to reach total limit of {total_url_limit}")
                    all_urls.extend(domain_urls_list[:remaining_capacity])
                    print(f"Reached total URL limit of {total_url_limit}. Stopping.")
                    break
                else:
                    # We can add all URLs from this domain
                    all_urls.extend(domain_urls_list)
            else:
                # No total URL limit, add all URLs
                all_urls.extend(domain_urls_list)
            
            processed_domains += 1
            print(f"Processed {processed_domains}/{len(domains)} domains, found {len(all_urls)} URLs so far")
            
        except Exception as e:
            print(f"Error processing {domain}: {e}")
    
    print(f"Total URLs found: {len(all_urls)}")
    print(f"Saving {len(all_urls)} URLs to file")
    
    with open('urls.txt', 'w') as f:
        f.write('\n'.join(all_urls))

def process_domain(domain):
    """Process a single domain and return all found URLs"""
    all_urls = set()
    
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
        
    except Exception as e:
        print(f"Error processing {domain}: {e}")
    
    return list(all_urls)

if __name__ == "__main__":
    # Load configuration
    config = load_config()
    url_limit_per_domain = config.get("url_limit_per_domain", 1000)
    total_url_limit = config.get("total_url_limit", TOTAL_URL_LIMIT)  # Get total URL limit from config or use env var
    split_large_domains = config.get("split_large_domains", False)
    max_urls_per_piece = config.get("max_urls_per_piece", 10000)
    
    # Load domains from file
    try:
        with open('domains.txt', 'r') as f:
            domains = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print("domains.txt not found. Please run cloudflare_fetcher.py first.")
        exit(1)
    
    print(f"Loaded {len(domains)} domains from domains.txt")
    
    # Process each domain
    all_urls = []
    domain_url_map = {}  # Map domains to their URLs for potential splitting
    
    for domain in domains:
        # Check if we've already reached the total URL limit
        if total_url_limit > 0 and len(all_urls) >= total_url_limit:
            print(f"Reached total URL limit of {total_url_limit}. Stopping.")
            break
            
        print(f"\nProcessing {domain}...")
        urls = process_domain(domain)
        
        # Apply URL limit per domain if configured
        if url_limit_per_domain > 0 and len(urls) > url_limit_per_domain:
            print(f"Limiting URLs for {domain} to {url_limit_per_domain} (from {len(urls)})")
            urls = urls[:url_limit_per_domain]
        
        domain_url_map[domain] = urls
        
        # Add URLs to all_urls, respecting the total URL limit
        if total_url_limit > 0:
            # Calculate how many more URLs we can add without exceeding the limit
            remaining_capacity = total_url_limit - len(all_urls)
            if remaining_capacity <= 0:
                # We've already reached the limit
                continue
            elif len(urls) > remaining_capacity:
                # We can only add some of the URLs from this domain
                print(f"Adding {remaining_capacity} of {len(urls)} URLs from {domain} to reach total limit of {total_url_limit}")
                all_urls.extend(urls[:remaining_capacity])
                print(f"Reached total URL limit of {total_url_limit}. Stopping.")
                break
            else:
                # We can add all URLs from this domain
                all_urls.extend(urls)
        else:
            # No total URL limit, add all URLs
            all_urls.extend(urls)
    
    # Handle large domains splitting if enabled
    if split_large_domains:
        large_domains = [domain for domain, urls in domain_url_map.items() if len(urls) > max_urls_per_piece]
        if large_domains:
            print(f"\nFound {len(large_domains)} domains with more than {max_urls_per_piece} URLs")
            print("Splitting large domains into separate files...")
            
            for domain in large_domains:
                urls = domain_url_map[domain]
                pieces = [urls[i:i+max_urls_per_piece] for i in range(0, len(urls), max_urls_per_piece)]
                
                for i, piece in enumerate(pieces):
                    with open(f'urls_{domain}_{i+1}.txt', 'w') as f:
                        f.write('\n'.join(piece))
                    print(f"Saved {len(piece)} URLs for {domain} (part {i+1}) to urls_{domain}_{i+1}.txt")
    
    # Save all URLs to file
    with open('urls.txt', 'w') as f:
        f.write('\n'.join(all_urls))
    
    print(f"\nTotal URLs saved: {len(all_urls)}")
    print(f"URLs saved to urls.txt")
    
    # Also save as JSON for reference
    with open('urls.json', 'w') as f:
        json.dump(all_urls, f, indent=2)