import os
import json
import time
import hashlib
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()  # Load environment variables

class SubscriptionVerifier:
    """Class to verify subscription status and enable premium features"""
    
    def __init__(self, license_key=None):
        """Initialize the subscription verifier"""
        self.license_key = license_key or os.getenv('LICENSE_KEY')
        self.verification_url = os.getenv('LICENSE_VERIFICATION_URL', 'https://api.example.com/verify')
        self.cache_file = Path('.license_cache.json')
        self.cache_duration = 86400  # 24 hours in seconds
    
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
            "license_key": "",
            "enable_premium_features": False
        }
    
    def verify_license(self, force_check=False):
        """Verify the license key and return subscription status"""
        config = self.load_config()
        license_key = self.license_key or config.get("license_key", "")
        
        if not license_key:
            print("No license key provided. Please purchase a subscription plan.")
            return {
                "valid": False,
                "plan": "none",
                "features": None,
                "message": "请购买订阅计划以使用此功能。"
            }
        
        # Check cache first if not forcing a check
        if not force_check and self.cache_file.exists():
            try:
                with open(self.cache_file, 'r') as f:
                    cache = json.load(f)
                
                # Check if cache is still valid
                if time.time() - cache.get("timestamp", 0) < self.cache_duration:
                    # Verify the license key matches
                    if cache.get("license_key_hash") == self._hash_license_key(license_key):
                        return cache.get("status")
            except (json.JSONDecodeError, KeyError):
                # Cache is invalid, continue with verification
                pass
        
        # Perform online verification
        try:
            response = requests.post(
                self.verification_url,
                json={
                    "license_key": license_key,
                    "machine_id": self._get_machine_id()
                },
                timeout=10
            )
            
            if response.status_code == 200:
                status = response.json()
                
                # Cache the result
                self._cache_result(license_key, status)
                
                return status
            else:
                print(f"License verification failed: {response.status_code}")
                # Fall back to offline verification
                return self._offline_verification(license_key)
                
        except requests.exceptions.RequestException as e:
            print(f"Error verifying license online: {e}")
            # Fall back to offline verification
            return self._offline_verification(license_key)
    
    def _offline_verification(self, license_key):
        """Perform offline license verification"""
        # Simple offline check - this should be enhanced with proper cryptographic verification
        if len(license_key) >= 20 and '-' in license_key:
            # Check if we have a cached result
            if self.cache_file.exists():
                try:
                    with open(self.cache_file, 'r') as f:
                        cache = json.load(f)
                    
                    if cache.get("license_key_hash") == self._hash_license_key(license_key):
                        return cache.get("status")
                except (json.JSONDecodeError, KeyError):
                    pass
            
            # Basic offline check - should be improved
            parts = license_key.split('-')
            if len(parts) >= 4:
                plan = parts[0].lower()
                if plan in ['basic', 'premium', 'pro', 'business', 'enterprise']:
                    features = None
                    if plan == 'basic':
                        features = self.get_basic_features()
                    elif plan in ['premium', 'pro']:
                        features = self.get_premium_features()
                    elif plan in ['business', 'enterprise']:
                        features = self.get_enterprise_features()
                    else:
                        features = self.get_basic_features()
                        
                    return {
                        "valid": True,
                        "plan": plan,
                        "features": features,
                        "offline_mode": True,
                        "expires": "Unknown (offline mode)"
                    }
        
        # Default to no access
        return {
            "valid": False,
            "plan": "none",
            "features": None,
            "offline_mode": True,
            "message": "许可证验证失败，请确保您有有效的许可证密钥。"
        }
    
    def _cache_result(self, license_key, status):
        """Cache the verification result"""
        cache = {
            "license_key_hash": self._hash_license_key(license_key),
            "timestamp": time.time(),
            "status": status
        }
        
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(cache, f)
        except Exception as e:
            print(f"Error caching license result: {e}")
    
    def _hash_license_key(self, license_key):
        """Create a hash of the license key for secure storage"""
        return hashlib.sha256(license_key.encode()).hexdigest()
    
    def _get_machine_id(self):
        """Get a unique identifier for the current machine"""
        # This is a simplified implementation
        # In a production environment, use a more robust method
        try:
            # Try to get a unique machine ID
            if os.path.exists('/etc/machine-id'):
                with open('/etc/machine-id', 'r') as f:
                    return f.read().strip()
            elif os.path.exists('/var/lib/dbus/machine-id'):
                with open('/var/lib/dbus/machine-id', 'r') as f:
                    return f.read().strip()
            else:
                # Fallback to a hash of hostname
                import socket
                return hashlib.sha256(socket.gethostname().encode()).hexdigest()
        except Exception:
            # Last resort fallback
            return hashlib.sha256(b'unknown').hexdigest()
    
    def get_basic_features(self):
        """Get the list of features available in the basic plan"""
        return {
            "max_domains": "unlimited",
            "max_urls_per_domain": 1000,
            "search_engines": ["google"],
            "domain_providers": ["cloudflare"],
            "advanced_features": True,
            "bulk_processing": False,
            "api_access": False,
            "cloudflare_worker": False,
            "price": "$5.99/月"
        }
    
    def get_premium_features(self):
        """Get the list of features available in the premium plan"""
        return {
            "max_domains": "unlimited",
            "max_urls_per_domain": 5000,
            "search_engines": ["google", "bing"],
            "domain_providers": ["cloudflare", "namecheap"],
            "advanced_features": True,
            "bulk_processing": True,
            "api_access": False,
            "cloudflare_worker": False,
            "price": "$19.99/月"
        }
    
    def get_enterprise_features(self):
        """Get the list of features available in the enterprise plan"""
        return {
            "max_domains": "unlimited",
            "max_urls_per_domain": "unlimited",
            "search_engines": ["google", "bing", "yandex"],
            "domain_providers": ["cloudflare", "namecheap", "godaddy"],
            "advanced_features": True,
            "bulk_processing": True,
            "api_access": True,
            "cloudflare_worker": True,
            "price": "$49.99/月"
        }
    
    def is_feature_enabled(self, feature_name):
        """Check if a specific feature is enabled for the current subscription"""
        status = self.verify_license()
        
        if not status.get("valid", False):
            # No valid license
            return False
        else:
            # Paid plan
            features = status.get("features", {})
            
            if feature_name in features:
                return features[feature_name]
            else:
                # Default to enabled for paid users if feature not specified
                return True
    
    def get_plan_name(self):
        """Get the current subscription plan name"""
        status = self.verify_license()
        return status.get("plan", "free")
    
    def is_enterprise_plan(self):
        """Check if the current subscription is an enterprise plan"""
        plan = self.get_plan_name()
        return plan.lower() in ["enterprise", "business"]
    
    def is_premium_plan(self):
        """Check if the current subscription is a premium plan or higher"""
        plan = self.get_plan_name()
        return plan.lower() in ["premium", "pro", "enterprise", "business"]
    
    def is_basic_plan(self):
        """Check if the current subscription is a basic plan or higher"""
        plan = self.get_plan_name()
        return plan.lower() in ["basic", "premium", "pro", "enterprise", "business"]

# Example usage
if __name__ == "__main__":
    # This code runs when the script is executed directly
    try:
        verifier = SubscriptionVerifier()
        status = verifier.verify_license()
        
        print(f"License status: {status['valid']}")
        print(f"Plan: {status['plan']}")
        
        if status['valid']:
            print("Premium features enabled!")
            print(f"Features: {status['features']}")
        else:
            print("Running in free mode")
            print(f"Free features: {status['features']}")
            
        # Check specific feature
        max_domains = verifier.is_feature_enabled("max_domains")
        print(f"Maximum domains allowed: {max_domains}")
        
        # Check plan level
        if verifier.is_enterprise_plan():
            print("Enterprise plan detected - Cloudflare Worker enabled")
        elif verifier.is_premium_plan():
            print("Premium plan detected - Bulk processing enabled")
        elif verifier.is_basic_plan():
            print("Basic plan detected - Multiple domain providers enabled")
        else:
            print("Free plan detected - Limited features")
        
    except Exception as e:
        print(f"Error: {e}")