from dotenv import load_dotenv
import os
import requests

load_dotenv()  # Load environment variables from .env file

def fetch_domains():
    api_token = os.getenv('CLOUDFLARE_API_TOKEN')
    zone_id = os.getenv('CLOUDFLARE_ZONE_ID')
    
    if not api_token or not zone_id:
        raise ValueError("Missing Cloudflare credentials in .env file")
    
    headers = {
        'Authorization': f'Bearer {api_token}',
        'Content-Type': 'application/json'
    }
    
    url = f'https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records'
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    domains = [
        record['name'] for record in response.json()['result'] 
        if record['type'] in ('A', 'CNAME', 'AAAA') and record['status'] == 'active'
    ]
    
    with open('domains.txt', 'w') as f:
        f.write('\n'.join(domains))

if __name__ == '__main__':
    fetch_domains()