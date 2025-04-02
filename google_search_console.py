import os
import json
import time
import requests
from pathlib import Path
from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

load_dotenv()  # Load environment variables

# Constants
SCOPES = ['https://www.googleapis.com/auth/webmasters']
SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE', 'service_account.json')

class GoogleSearchConsole:
    """Class to interact with Google Search Console API"""
    
    def __init__(self):
        """Initialize the Google Search Console API client"""
        self.credentials = None
        self.service = None
        self.initialize_service()
    
    def initialize_service(self):
        """Initialize the Google Search Console API service"""
        try:
            # Check if service account file exists
            if not Path(SERVICE_ACCOUNT_FILE).exists():
                print(f"Service account file not found: {SERVICE_ACCOUNT_FILE}")
                print("Using environment variables for authentication instead.")
                
                # Try to use environment variables for authentication
                private_key = os.getenv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')
                client_email = os.getenv('GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL')
                
                if private_key and client_email:
                    # Replace escaped newlines with actual newlines
                    private_key = private_key.replace('\\n', '\n')
                    
                    # Create credentials from environment variables
                    self.credentials = service_account.Credentials.from_service_account_info({
                        "private_key": private_key,
                        "client_email": client_email,
                        "type": "service_account"
                    }, scopes=SCOPES)
                else:
                    raise ValueError("Missing service account credentials in environment variables")
            else:
                # Create credentials from service account file
                self.credentials = service_account.Credentials.from_service_account_file(
                    SERVICE_ACCOUNT_FILE, scopes=SCOPES)
            
            # Build the service
            self.service = build('webmasters', 'v3', credentials=self.credentials)
            print("Successfully initialized Google Search Console API service")
            
        except Exception as e:
            print(f"Failed to initialize Google Search Console API: {str(e)}")
            self.service = None
    
    def is_initialized(self):
        """Check if the service is initialized"""
        return self.service is not None
    
    def get_sites(self):
        """Get all sites in Google Search Console"""
        if not self.is_initialized():
            return []
        
        try:
            sites = self.service.sites().list().execute()
            return sites.get('siteEntry', [])
        except HttpError as e:
            print(f"Error getting sites: {str(e)}")
            return []
    
    def submit_url(self, url, type='URL_UPDATED'):
        """Submit a URL to Google for indexing
        
        Args:
            url (str): The URL to submit
            type (str): The type of submission, either 'URL_UPDATED' or 'URL_DELETED'
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.is_initialized():
            return False
        
        try:
            response = self.service.urlNotifications().publish(
                body={
                    'url': url,
                    'type': type
                }
            ).execute()
            
            print(f"Successfully submitted {url} to Google Search Console")
            print(f"Response: {response}")
            return True
            
        except HttpError as e:
            print(f"Error submitting URL {url}: {str(e)}")
            return False
    
    def submit_sitemap(self, site_url, sitemap_url):
        """Submit a sitemap to Google Search Console
        
        Args:
            site_url (str): The site URL in Google Search Console
            sitemap_url (str): The sitemap URL to submit
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.is_initialized():
            return False
        
        try:
            response = self.service.sitemaps().submit(
                siteUrl=site_url,
                feedpath=sitemap_url
            ).execute()
            
            print(f"Successfully submitted sitemap {sitemap_url} for site {site_url}")
            return True
            
        except HttpError as e:
            print(f"Error submitting sitemap {sitemap_url}: {str(e)}")
            return False
    
    def get_sitemaps(self, site_url):
        """Get all sitemaps for a site
        
        Args:
            site_url (str): The site URL in Google Search Console
            
        Returns:
            list: List of sitemaps
        """
        if not self.is_initialized():
            return []
        
        try:
            response = self.service.sitemaps().list(siteUrl=site_url).execute()
            return response.get('sitemap', [])
            
        except HttpError as e:
            print(f"Error getting sitemaps for site {site_url}: {str(e)}")
            return []

# Example usage
if __name__ == '__main__':
    gsc = GoogleSearchConsole()
    
    if gsc.is_initialized():
        # Get all sites
        sites = gsc.get_sites()
        print(f"Found {len(sites)} sites in Google Search Console")
        
        for site in sites:
            site_url = site.get('siteUrl')
            print(f"Site: {site_url}")
            
            # Get sitemaps for the site
            sitemaps = gsc.get_sitemaps(site_url)
            print(f"Found {len(sitemaps)} sitemaps for site {site_url}")
            
            # Submit a test URL
            test_url = f"{site_url.rstrip('/')}/test-page"
            gsc.submit_url(test_url)