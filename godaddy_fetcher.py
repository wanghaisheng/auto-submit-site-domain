import os
import json
import time
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()  # Load environment variables

class GoDaddyDomainFetcher:
    """Class to fetch domains from GoDaddy API"""
    
    def __init__(self, api_key=None, api_secret=None):
        """Initialize the GoDaddy API client"""
        self.api_key = api_key or os.getenv('GODADDY_API_KEY')
        self.api_secret = api_secret or os.getenv('GODADDY_API_SECRET')
        
        if not all([self.api_key, self.api_secret]):
            raise ValueError("GoDaddy API credentials not found. Set GODADDY_API_KEY and GODADDY_API_SECRET in .env file.")
        
        self.base_url = 'https://api.godaddy.com/v1'
        self.headers = {
            'Authorization': f'sso-key {self.api_key}:{self.api_secret}',
            'Content-Type': 'application/json'
        }
        self.request_delay = int(os.getenv('REQUEST_DELAY', 5))
    
    def load_config(self):
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
            "url_limit_per_domain": 1000
        }
    
    def get_domains(self):
        """Get list of domains from GoDaddy API"""
        config = self.load_config()
        
        # Check if we should use domain file instead of GoDaddy API
        if config.get("use_domain_file", False):
            return self.fetch_domains_from_file(config)
        
        all_domains = []
        limit = 100  # Maximum allowed by GoDaddy API
        offset = 0
        
        while True:
            endpoint = f"{self.base_url}/domains"
            params = {
                'limit': limit,
                'offset': offset,
                'statuses': 'ACTIVE'
            }
            
            try:
                response = requests.get(endpoint, headers=self.headers, params=params)
                response.raise_for_status()
                
                domains_data = response.json()
                if not domains_data:
                    break
                
                # Extract domain names
                for domain in domains_data:
                    domain_name = domain.get('domain')
                    if domain_name:
                        all_domains.append(domain_name)
                
                # If we got fewer domains than the limit, we've reached the end
                if len(domains_data) < limit:
                    break
                
                offset += limit
                
                # Respect rate limits
                time.sleep(self.request_delay)
                
            except requests.exceptions.RequestException as e:
                print(f"Error fetching domains from GoDaddy: {e}")
                break
        
        # Apply whitelist/blacklist filtering
        filtered_domains = self.filter_domains(all_domains, config)
        
        # Save domains to file
        self.save_domains(filtered_domains)
        
        return filtered_domains
    
    def fetch_domains_from_file(self, config):
        """Fetch domains from a file instead of API"""
        domain_file = config.get("domain_file_path", "domains_list.txt")
        
        try:
            with open(domain_file, 'r') as f:
                domains = [line.strip() for line in f if line.strip()]
            
            # Apply whitelist/blacklist filtering
            filtered_domains = self.filter_domains(domains, config)
            
            # Save filtered domains
            self.save_domains(filtered_domains)
            
            return filtered_domains
            
        except FileNotFoundError:
            print(f"Domain file not found: {domain_file}")
            return []
    
    def filter_domains(self, domains, config):
        """Apply whitelist and blacklist filtering to domains"""
        whitelist = config.get("domain_whitelist", [])
        blacklist = config.get("domain_blacklist", [])
        
        # Apply whitelist if it exists
        if whitelist:
            domains = [domain for domain in domains if any(domain.endswith(wl) for wl in whitelist)]
        
        # Apply blacklist
        if blacklist:
            domains = [domain for domain in domains if not any(domain.endswith(bl) for bl in blacklist)]
        
        return domains
    
    def save_domains(self, domains):
        """Save domains to file"""
        # Save as plain text
        with open('domains.txt', 'w') as f:
            for domain in domains:
                f.write(f"{domain}\n")
        
        # Save as JSON for more detailed information
        with open('domains.json', 'w') as f:
            json.dump({
                'domains': domains,
                'count': len(domains),
                'source': 'godaddy',
                'timestamp': time.time()
            }, f, indent=2)
        
        print(f"Saved {len(domains)} domains to domains.txt and domains.json")

# Example usage
if __name__ == "__main__":
    # This code runs when the script is executed directly
    try:
        fetcher = GoDaddyDomainFetcher()
        domains = fetcher.get_domains()
        print(f"Found {len(domains)} active domains")
    except Exception as e:
        print(f"Error: {e}")