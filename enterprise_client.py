import os
import json
import argparse
import requests
from pathlib import Path
from dotenv import load_dotenv
from subscription_verifier import SubscriptionVerifier

load_dotenv()  # Load environment variables

class EnterpriseClient:
    """Client for enterprise users to submit large volumes of URLs or domains"""
    
    def __init__(self, license_key=None):
        """Initialize the enterprise client"""
        self.license_key = license_key or os.getenv('LICENSE_KEY')
        self.worker_url = os.getenv('CLOUDFLARE_WORKER_URL', 'https://auto-submit.your-worker.workers.dev')
        
        # Verify enterprise subscription
        self.verifier = SubscriptionVerifier(self.license_key)
        if not self.verifier.is_enterprise_plan():
            raise ValueError("This tool requires an enterprise subscription. Please upgrade your plan.")
    
    def submit_urls(self, urls_file):
        """Submit a list of URLs from a file"""
        # Load URLs from file
        urls = self._load_lines_from_file(urls_file)
        if not urls:
            print(f"No URLs found in {urls_file}")
            return False
        
        print(f"Loaded {len(urls)} URLs from {urls_file}")
        
        # Submit to Cloudflare Worker
        return self._submit_to_worker({
            'type': 'urls',
            'urls': urls,
            'license_key': self.license_key
        })
    
    def submit_domains(self, domains_file):
        """Submit a list of domains from a file"""
        # Load domains from file
        domains = self._load_lines_from_file(domains_file)
        if not domains:
            print(f"No domains found in {domains_file}")
            return False
        
        print(f"Loaded {len(domains)} domains from {domains_file}")
        
        # Submit to Cloudflare Worker
        return self._submit_to_worker({
            'type': 'domains',
            'domains': domains,
            'license_key': self.license_key
        })
    
    def _load_lines_from_file(self, file_path):
        """Load lines from a text file, removing duplicates and empty lines"""
        try:
            with open(file_path, 'r') as f:
                lines = [line.strip() for line in f if line.strip()]
                return list(set(lines))  # Remove duplicates
        except Exception as e:
            print(f"Error reading file {file_path}: {e}")
            return []
    
    def _submit_to_worker(self, payload):
        """Submit data to Cloudflare Worker API"""
        try:
            print(f"Submitting to Cloudflare Worker: {self.worker_url}")
            response = requests.post(
                self.worker_url,
                json=payload,
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout=60  # Longer timeout for large payloads
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"Success! {result.get('message', '')}")
                
                # Print batch information
                if 'batches' in result:
                    print(f"Split into {result['batches']} batches for processing")
                
                # Print batch results if available
                if 'batch_results' in result:
                    for i, batch in enumerate(result['batch_results']):
                        status = 'Success' if batch.get('success', False) else 'Failed'
                        print(f"Batch {i+1}: {status}")
                
                return True
            else:
                print(f"Error: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"Error submitting to worker: {e}")
            return False

def main():
    """Command line interface for the enterprise client"""
    parser = argparse.ArgumentParser(description='Enterprise URL Submission Client')
    parser.add_argument('--license-key', help='Your enterprise license key')
    
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # URLs command
    urls_parser = subparsers.add_parser('urls', help='Submit URLs from a file')
    urls_parser.add_argument('file', help='Path to file containing URLs (one per line)')
    
    # Domains command
    domains_parser = subparsers.add_parser('domains', help='Submit domains from a file')
    domains_parser.add_argument('file', help='Path to file containing domains (one per line)')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        client = EnterpriseClient(args.license_key)
        
        if args.command == 'urls':
            client.submit_urls(args.file)
        elif args.command == 'domains':
            client.submit_domains(args.file)
            
    except ValueError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()