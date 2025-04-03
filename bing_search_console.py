import os
import json
import time
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()  # Load environment variables

class BingWebmasterTools:
    """Class to interact with Bing Webmaster Tools API"""
    
    def __init__(self, api_key=None):
        """Initialize the Bing Webmaster Tools API client"""
        self.api_key = api_key or os.getenv('BING_API_KEY')
        if not self.api_key:
            raise ValueError("Bing API key not found. Set BING_API_KEY in .env file or pass to constructor.")
        
        self.base_url = 'https://ssl.bing.com/webmaster/api.svc/json'
        self.headers = {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': self.api_key
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
    
    def get_sites(self):
        """Get list of sites registered in Bing Webmaster Tools"""
        endpoint = f"{self.base_url}/GetUserSites"
        
        try:
            response = requests.get(endpoint, headers=self.headers)
            response.raise_for_status()
            return response.json().get('d', {}).get('results', [])
        except requests.exceptions.RequestException as e:
            print(f"Error getting sites from Bing Webmaster Tools: {e}")
            return []
    
    def submit_url(self, site_url, page_url):
        """Submit a URL to Bing for indexing"""
        endpoint = f"{self.base_url}/SubmitUrl"
        
        data = {
            'siteUrl': site_url,
            'url': page_url
        }
        
        try:
            response = requests.post(
                endpoint, 
                headers=self.headers,
                json=data
            )
            response.raise_for_status()
            print(f"Successfully submitted URL to Bing: {page_url}")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Error submitting URL to Bing: {e}")
            return False
        finally:
            # Respect rate limits
            time.sleep(self.request_delay)
    
    def submit_sitemap(self, site_url, sitemap_url):
        """Submit a sitemap to Bing Webmaster Tools"""
        endpoint = f"{self.base_url}/SubmitSitemap"
        
        data = {
            'siteUrl': site_url,
            'sitemapUrl': sitemap_url
        }
        
        try:
            response = requests.post(
                endpoint, 
                headers=self.headers,
                json=data
            )
            response.raise_for_status()
            print(f"Successfully submitted sitemap to Bing: {sitemap_url}")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Error submitting sitemap to Bing: {e}")
            return False
        finally:
            # Respect rate limits
            time.sleep(self.request_delay)
    
    def batch_submit_urls(self, site_url, urls, batch_size=10, max_urls=100):
        """Submit multiple URLs to Bing in batches
        
        Args:
            site_url (str): The site URL registered in Bing Webmaster Tools
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
        log_file = f"submission_log_bing_{timestamp}.txt"
        
        with open(log_file, 'w') as f:
            f.write(f"Bing URL submission log - {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Site: {site_url}\n")
            f.write(f"Total URLs: {len(urls_to_submit)}\n\n")
        
        # Process URLs in batches
        for i in range(0, len(urls_to_submit), batch_size):
            batch = urls_to_submit[i:i+batch_size]
            print(f"Processing batch {i//batch_size + 1}/{(len(urls_to_submit) + batch_size - 1)//batch_size}")
            
            for url in batch:
                result = self.submit_url(site_url, url)
                
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
        
        print(f"Bing submission complete. Results: {successful} successful, {failed} failed, {skipped} skipped.")
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
        bing_api = BingWebmasterTools()
        
        # Get sites
        sites = bing_api.get_sites()
        print(f"Found {len(sites)} sites in Bing Webmaster Tools")
        
        # Read URLs from file
        with open('urls.txt', 'r') as f:
            urls = [line.strip() for line in f if line.strip()]
        
        if not urls:
            print("No URLs found in urls.txt")
            exit(0)
        
        # Extract domain from first URL to use as site_url
        from urllib.parse import urlparse
        first_url = urls[0]
        parsed_url = urlparse(first_url)
        site_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
        # Submit sitemap if available
        sitemap_url = f"{site_url}/sitemap.xml"
        bing_api.submit_sitemap(site_url, sitemap_url)
        
        # Submit URLs in batches
        result = bing_api.batch_submit_urls(site_url, urls[:100])  # Limit to 100 URLs for testing
        print(f"Submission results: {result}")
        
    except Exception as e:
        print(f"Error: {e}")