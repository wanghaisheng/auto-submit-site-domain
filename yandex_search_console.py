import os
import json
import time
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()  # Load environment variables

class YandexWebmasterTools:
    """Class to interact with Yandex Webmaster API"""
    
    def __init__(self, api_key=None):
        """Initialize the Yandex Webmaster API client"""
        self.api_key = api_key or os.getenv('YANDEX_API_KEY')
        if not self.api_key:
            raise ValueError("Yandex API key not found. Set YANDEX_API_KEY in .env file or pass to constructor.")
        
        self.base_url = 'https://api.webmaster.yandex.net/v4'
        self.headers = {
            'Authorization': f'OAuth {self.api_key}',
            'Content-Type': 'application/json'
        }
        self.request_delay = int(os.getenv('REQUEST_DELAY', 5))
        
        # Check for license key to enable premium features
        self.license_key = os.getenv('LICENSE_KEY')
        if self.license_key:
            try:
                from subscription_verifier import SubscriptionVerifier
                self.verifier = SubscriptionVerifier(self.license_key)
                self.subscription = self.verifier.verify_license()
                print(f"License status: {self.subscription['valid']}")
                print(f"Plan: {self.subscription['plan']}")
            except ImportError:
                print("Subscription verifier not available. Running with default settings.")
                self.subscription = {"valid": False, "plan": "free"}
        else:
            self.subscription = {"valid": False, "plan": "free"}
    
    def get_user_id(self):
        """Get the user ID for the authenticated user"""
        endpoint = f"{self.base_url}/user"
        
        try:
            response = requests.get(endpoint, headers=self.headers)
            response.raise_for_status()
            return response.json().get('user_id')
        except requests.exceptions.RequestException as e:
            print(f"Error getting user ID from Yandex Webmaster: {e}")
            return None
    
    def get_sites(self):
        """Get list of sites registered in Yandex Webmaster"""
        user_id = self.get_user_id()
        if not user_id:
            return []
        
        endpoint = f"{self.base_url}/user/{user_id}/hosts"
        
        try:
            response = requests.get(endpoint, headers=self.headers)
            response.raise_for_status()
            return response.json().get('hosts', [])
        except requests.exceptions.RequestException as e:
            print(f"Error getting sites from Yandex Webmaster: {e}")
            return []
    
    def add_site(self, site_url):
        """Add a new site to Yandex Webmaster"""
        user_id = self.get_user_id()
        if not user_id:
            return False
        
        endpoint = f"{self.base_url}/user/{user_id}/hosts"
        
        data = {
            'host_url': site_url
        }
        
        try:
            response = requests.post(
                endpoint, 
                headers=self.headers,
                json=data
            )
            response.raise_for_status()
            print(f"Successfully added site to Yandex Webmaster: {site_url}")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Error adding site to Yandex Webmaster: {e}")
            return False
        finally:
            # Respect rate limits
            time.sleep(self.request_delay)
    
    def verify_site(self, host_id, verification_method='DNS'):
        """Get verification information for a site"""
        user_id = self.get_user_id()
        if not user_id:
            return None
        
        endpoint = f"{self.base_url}/user/{user_id}/hosts/{host_id}/verification"
        
        try:
            response = requests.get(endpoint, headers=self.headers)
            response.raise_for_status()
            verification_info = response.json()
            
            print(f"Verification status: {verification_info.get('verification_state')}")
            print(f"Verification methods: {verification_info.get('verification_uis')}")
            
            return verification_info
        except requests.exceptions.RequestException as e:
            print(f"Error getting verification info from Yandex Webmaster: {e}")
            return None
    
    def submit_sitemap(self, host_id, sitemap_url):
        """Submit a sitemap to Yandex Webmaster"""
        user_id = self.get_user_id()
        if not user_id or not host_id:
            return False
        
        endpoint = f"{self.base_url}/user/{user_id}/hosts/{host_id}/sitemaps"
        
        data = {
            'url': sitemap_url
        }
        
        try:
            response = requests.post(
                endpoint, 
                headers=self.headers,
                json=data
            )
            response.raise_for_status()
            print(f"Successfully submitted sitemap to Yandex: {sitemap_url}")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Error submitting sitemap to Yandex: {e}")
            return False
        finally:
            # Respect rate limits
            time.sleep(self.request_delay)
    
    def get_host_id(self, site_url):
        """Get the host ID for a given site URL"""
        sites = self.get_sites()
        
        for site in sites:
            if site.get('host_url') == site_url:
                return site.get('host_id')
        
        return None
    
    def submit_url(self, host_id, url):
        """Submit a URL to Yandex for indexing"""
        user_id = self.get_user_id()
        if not user_id or not host_id:
            return False
        
        endpoint = f"{self.base_url}/user/{user_id}/hosts/{host_id}/recrawl/queue"
        
        data = {
            'url': url
        }
        
        try:
            response = requests.post(
                endpoint, 
                headers=self.headers,
                json=data
            )
            response.raise_for_status()
            print(f"Successfully submitted URL to Yandex: {url}")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Error submitting URL to Yandex: {e}")
            return False
        finally:
            # Respect rate limits
            time.sleep(self.request_delay)
    
    def batch_submit_urls(self, site_url, urls, batch_size=10):
        """Submit multiple URLs to Yandex in batches"""
        host_id = self.get_host_id(site_url)
        if not host_id:
            print(f"Site not found in Yandex Webmaster: {site_url}")
            print("Try adding the site first using add_site() method.")
            return {
                'successful': 0,
                'failed': len(urls),
                'total': len(urls)
            }
        
        successful = 0
        failed = 0
        
        # Process URLs in batches
        for i in range(0, len(urls), batch_size):
            batch = urls[i:i+batch_size]
            print(f"Processing batch {i//batch_size + 1}/{(len(urls) + batch_size - 1)//batch_size}")
            
            for url in batch:
                result = self.submit_url_for_indexing(host_id, url)
                if result:
                    successful += 1
                else:
                    failed += 1
            
            # Add a delay between batches
            if i + batch_size < len(urls):
                print(f"Waiting {self.request_delay} seconds before next batch...")
                time.sleep(self.request_delay * 2)
        
        return {
            'successful': successful,
            'failed': failed,
            'total': len(urls)
        }

    def batch_submit_urls(self, host_id, urls, batch_size=10, max_urls=100):
        """Submit multiple URLs to Yandex in batches
        
        Args:
            host_id (str): The host ID in Yandex Webmaster Tools
            urls (list): List of URLs to submit
            batch_size (int): Number of URLs to process in each batch
            max_urls (int): Maximum number of URLs to submit in total
            
        Returns:
            dict: Results of the submission with success and failure counts
        """
        # Check if premium features are enabled
        if not self.subscription.get("valid", False):
            # Free plan - limit URLs
            urls_to_submit = urls[:max_urls]
            skipped = len(urls) - len(urls_to_submit)
            if skipped > 0:
                print(f"Free plan: Limited to {max_urls} URLs. Skipping {skipped} URLs.")
                print(f"Upgrade to premium for unlimited URL submissions.")
        else:
            # Premium plan - no limit
            urls_to_submit = urls
            skipped = 0
        
        successful = 0
        failed = 0
        errors = []
        
        # Create log file
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        log_file = f"submission_log_yandex_{timestamp}.txt"
        
        with open(log_file, 'w') as f:
            f.write(f"Yandex URL submission log - {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Host ID: {host_id}\n")
            f.write(f"Total URLs: {len(urls_to_submit)}\n\n")
        
        # Process URLs in batches
        for i in range(0, len(urls_to_submit), batch_size):
            batch = urls_to_submit[i:i+batch_size]
            print(f"Processing batch {i//batch_size + 1}/{(len(urls_to_submit) + batch_size - 1)//batch_size}")
            
            for url in batch:
                result = self.submit_url(host_id, url)
                
                if result:
                    successful += 1
                    status = "SUCCESS"
                else:
                    failed += 1
                    status = "FAILED"
                    errors.append(f"Failed to submit {url}")
                
                # Log the result
                with open(log_file, 'a') as f:
                    f.write(f"{status}: {url}\n")
            
            # Add a delay between batches
            if i + batch_size < len(urls_to_submit):
                print(f"Waiting {self.request_delay} seconds before next batch...")
                time.sleep(self.request_delay * 2)
        
        # Log summary
        with open(log_file, 'a') as f:
            f.write(f"\nSummary:\n")
            f.write(f"  Success: {successful}\n")
            f.write(f"  Failed: {failed}\n")
            f.write(f"  Skipped: {skipped}\n")
        
        print(f"Yandex submission complete. Results: {successful} successful, {failed} failed, {skipped} skipped.")
        print(f"Log saved to {log_file}")
        
        return {
            'successful': successful,
            'failed': failed,
            'skipped': skipped,
            'total': len(urls),
            'errors': errors,
            'log_file': log_file
        }

# Example usage
if __name__ == "__main__":
    # This code runs when the script is executed directly
    try:
        yandex_api = YandexWebmasterTools()
        
        # Get user ID
        user_id = yandex_api.get_user_id()
        print(f"User ID: {user_id}")
        
        # Get sites
        sites = yandex_api.get_sites()
        print(f"Found {len(sites)} sites in Yandex Webmaster")
        
        # Read URLs from file
        with open('urls.txt', 'r') as f:
            urls = [line.strip() for line in f if line.strip()]
        
        if not urls:
            print("No URLs found in urls.txt")
            exit(0)
        
        # If sites are available, submit URLs
        if sites:
            host_id = sites[0].get('host_id')
            host_url = sites[0].get('unicode_host_url')
            
            print(f"\nProcessing site: {host_url}")
            
            # Submit sitemap if available
            sitemap_url = f"{host_url}/sitemap.xml"
            yandex_api.submit_sitemap(host_id, sitemap_url)
            
            # Submit URLs in batches
            result = yandex_api.batch_submit_urls(host_id, urls[:100])  # Limit to 100 URLs for testing
            print(f"Submission results: {result}")
        
    except Exception as e:
        print(f"Error: {e}")