from dotenv import load_dotenv
import os
import requests
import time
import json
from pathlib import Path

load_dotenv()  # Load environment variables from .env file

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
        "submit_not_indexed": True,
        "submit_sitemap": True,
        "split_large_domains": False,
        "max_urls_per_piece": 10000
    }

def fetch_domains():
    config = load_config()
    
    # Check if we should use domain file instead of Cloudflare API
    if config.get("use_domain_file", False):
        return fetch_domains_from_file(config)
    
    api_token = os.getenv('CLOUDFLARE_API_TOKEN')
    account_id = os.getenv('CLOUDFLARE_ACCOUNT_ID')
    
    if not api_token:
        raise ValueError("Missing Cloudflare API token in .env file")
    
    headers = {
        'Authorization': f'Bearer {api_token}',
        'Content-Type': 'application/json'
    }
    
    # Step 1: Get all zones (domains) in the account
    all_domains = set()
    page = 1
    per_page = 50
    
    print("Fetching zones from Cloudflare account...")
    
    while True:
        # Include account_id in the request if available
        if account_id:
            zones_url = f'https://api.cloudflare.com/client/v4/zones?page={page}&per_page={per_page}&account.id={account_id}'
        else:
            zones_url = f'https://api.cloudflare.com/client/v4/zones?page={page}&per_page={per_page}'
            
        try:
            response = requests.get(zones_url, headers=headers)
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            print(f"Error fetching zones: {e}")
            print(f"Response content: {e.response.text if hasattr(e, 'response') else 'No response content'}")
            raise
        
        result = response.json()
        zones = result['result']
        
        if not zones:
            break
            
        # Add the main domains
        for zone in zones:
            domain = zone['name']
            all_domains.add(domain)
            print(f"Found zone: {domain}")
            
            # Step 2: For each zone, get all DNS records (subdomains)
            zone_id = zone['id']
            dns_page = 1
            
            while True:
                dns_url = f'https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?page={dns_page}&per_page={per_page}'
                dns_response = requests.get(dns_url, headers=headers)
                
                if dns_response.status_code != 200:
                    print(f"Error fetching DNS records for {domain}: {dns_response.text}")
                    break
                    
                dns_result = dns_response.json()
                records = dns_result['result']
                
                if not records:
                    break
                    
                # Add all active DNS records (subdomains)
                for record in records:
                    if record['type'] in ('A', 'CNAME', 'AAAA') and record.get('status', 'active') == 'active':
                        subdomain = record['name']
                        all_domains.add(subdomain)
                        print(f"  - Found subdomain: {subdomain}")
                
                dns_page += 1
                time.sleep(0.5)  # Avoid rate limiting
        
        # Check if we've processed all zones
        total_pages = result['result_info']['total_pages']
        if page >= total_pages:
            break
            
        page += 1
        time.sleep(1)  # Avoid rate limiting
    
    # Convert set to sorted list
    domain_list = sorted(list(all_domains))
    
    # Apply domain whitelist/blacklist filtering
    domain_list = filter_domains(domain_list, config)
    
    print(f"\nTotal domains and subdomains found after filtering: {len(domain_list)}")
    
    # Save to file
    with open('domains.txt', 'w') as f:
        f.write('\n'.join(domain_list))
        
    # Also save as JSON for reference
    with open('domains.json', 'w') as f:
        json.dump({"domains": domain_list, "count": len(domain_list)}, f, indent=2)
        
    print(f"Domains saved to domains.txt and domains.json")
    
    return domain_list

def fetch_domains_from_file(config):
    """Fetch domains from a file instead of Cloudflare API"""
    domain_file = config.get("domain_file_path", "domains_list.txt")
    
    try:
        with open(domain_file, 'r') as f:
            domains = [line.strip() for line in f if line.strip()]
        
        print(f"Loaded {len(domains)} domains from {domain_file}")
        
        # Apply domain whitelist/blacklist filtering
        domains = filter_domains(domains, config)
        
        print(f"Total domains after filtering: {len(domains)}")
        
        # Save to standard files for compatibility with rest of the pipeline
        with open('domains.txt', 'w') as f:
            f.write('\n'.join(domains))
        
        with open('domains.json', 'w') as f:
            json.dump({"domains": domains, "count": len(domains)}, f, indent=2)
        
        return domains
    
    except Exception as e:
        print(f"Error reading domain file {domain_file}: {e}")
        return []

def filter_domains(domains, config):
    """Filter domains based on whitelist and blacklist"""
    whitelist = config.get("domain_whitelist", [])
    blacklist = config.get("domain_blacklist", [])
    
    # If whitelist is provided, only keep domains in the whitelist
    if whitelist:
        print(f"Applying whitelist filter with {len(whitelist)} domains")
        filtered_domains = []
        for domain in domains:
            if any(domain.endswith(white_domain) for white_domain in whitelist):
                filtered_domains.append(domain)
        domains = filtered_domains
    
    # Remove domains in the blacklist
    if blacklist:
        print(f"Applying blacklist filter with {len(blacklist)} domains")
        filtered_domains = []
        for domain in domains:
            if not any(domain.endswith(black_domain) for black_domain in blacklist):
                filtered_domains.append(domain)
        domains = filtered_domains
    
    return domains

if __name__ == '__main__':
    fetch_domains()