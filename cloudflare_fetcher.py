from dotenv import load_dotenv
import os
import requests
import time
import json

load_dotenv()  # Load environment variables from .env file

def fetch_domains():
    api_token = os.getenv('CLOUDFLARE_API_TOKEN')
    
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
        zones_url = f'https://api.cloudflare.com/client/v4/zones?page={page}&per_page={per_page}'
        response = requests.get(zones_url, headers=headers)
        response.raise_for_status()
        
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
    
    print(f"\nTotal domains and subdomains found: {len(domain_list)}")
    
    # Save to file
    with open('domains.txt', 'w') as f:
        f.write('\n'.join(domain_list))
        
    # Also save as JSON for reference
    with open('domains.json', 'w') as f:
        json.dump({"domains": domain_list, "count": len(domain_list)}, f, indent=2)
        
    print(f"Domains saved to domains.txt and domains.json")
    
    return domain_list

if __name__ == '__main__':
    fetch_domains()