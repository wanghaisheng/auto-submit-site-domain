import os
import json
import time
import requests
import xml.etree.ElementTree as ET
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()  # Load environment variables

class NamecheapDomainFetcher:
    """Class to fetch domains from Namecheap API"""
    
    def __init__(self, api_key=None, username=None, api_user=None):
        """Initialize the Namecheap API client"""
        self.api_key = api_key or os.getenv('NAMECHEAP_API_KEY')
        self.username = username or os.getenv('NAMECHEAP_USERNAME')
        self.api_user = api_user or os.getenv('NAMECHEAP_API_USER', self.username)
        self.client_ip = os.getenv('NAMECHEAP_CLIENT_IP', '127.0.0.1')
        
        if not all([self.api_key, self.username]):
            raise ValueError("Namecheap API credentials not found. Set NAMECHEAP_API_KEY and NAMECHEAP_USERNAME in .env file.")
        
        self.base_url = 'https://api.namecheap.com/xml.response'
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
        """Get list of domains from Namecheap API"""
        config = self.load_config()
        
        # Check if we should use domain file instead of Namecheap API
        if config.get("use_domain_file", False):
            return self.fetch_domains_from_file(config)
        
        params = {
            'ApiUser': self.api_user,
            'ApiKey': self.api_key,
            'UserName': self.username,
            'ClientIp': self.client_ip,
            'Command': 'namecheap.domains.getList',
            'PageSize': 100,  # Maximum allowed by Namecheap
            'Page': 1
        }
        
        all_domains = []
        total_pages = 1
        current_page = 1
        
        while current_page <= total_pages:
            params['Page'] = current_page
            
            try:
                response = requests.get(self.base_url, params=params)
                response.raise_for_status()
                
                # Parse XML response
                root = ET.fromstring(response.content)
                
                # Check for errors
                error_count = int(root.find('.//Errors').get('Count', '0'))
                if error_count > 0:
                    error_msg = root.find('.//Errors/Error').text
                    print(f"Namecheap API error: {error_msg}")
                    break
                
                # Get domain list
                domains_element = root.find('.//CommandResponse/DomainGetListResult')
                if domains_element is None:
                    break
                    
                # Update total pages if this is the first request
                if current_page == 1:
                    total_pages = int(domains_element.get('TotalPages', '1'))
                
                # Extract domains
                for domain in domains_element.findall('./Domain'):
                    domain_name = domain.get('Name')
                    domain_status = domain.get('Status')
                    
                    # Only include active domains
                    if domain_status.lower() == 'active':
                        all_domains.append(domain_name)
                
                current_page += 1
                
                # Respect rate limits
                time.sleep(self.request_delay)
                
            except requests.exceptions.RequestException as e:
                print(f"Error fetching domains from Namecheap: {e}")
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
                'source': 'namecheap',
                'timestamp': time.time()
            }, f, indent=2)
        
        print(f"Saved {len(domains)} domains to domains.txt and domains.json")

# Example usage
if __name__ == "__main__":
    # This code runs when the script is executed directly
    try:
        fetcher = NamecheapDomainFetcher()
        domains = fetcher.get_domains()
        print(f"Found {len(domains)} active domains")
    except Exception as e:
        print(f"Error: {e}")