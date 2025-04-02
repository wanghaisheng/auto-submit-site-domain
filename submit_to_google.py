from DrissionPage import ChromiumPage, ChromiumOptions
import time
import os
import random
from dotenv import load_dotenv
import datetime
import json
import re
from pathlib import Path

load_dotenv()  # Load environment variables

# Get settings from environment variables
REQUEST_DELAY = int(os.getenv('REQUEST_DELAY', 5))  # Default 5 seconds between submissions
GOOGLE_SEARCH_LIMIT = int(os.getenv('GOOGLE_SEARCH_LIMIT', 10))  # Default 10 submissions per minute
DRISSIONPAGE_TIMEOUT = int(os.getenv('DRISSIONPAGE_TIMEOUT', 30))  # Browser timeout

def get_random_delay(base_delay):
    """Add some randomness to delays to appear more human-like"""
    return base_delay + random.uniform(0.5, 2.5)

def load_index_database():
    """Load or create the index tracking database"""
    db_path = Path('index_database.json')
    if db_path.exists():
        try:
            with open(db_path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print("Error reading database file. Creating new database.")
    
    # Create new database if file doesn't exist or is corrupted
    return {}

def save_index_database(db):
    """Save the index tracking database"""
    with open('index_database.json', 'w') as f:
        json.dump(db, f, indent=2)

def check_indexed_status(page, url):
    """Check if a URL is indexed in Google
    Returns: (is_indexed, result_count)
    """
    search_url = f"https://www.google.com/search?q=site:{url}"
    page.get(search_url)
    time.sleep(2)
    
    # Check for CAPTCHA or blocking
    if "unusual traffic" in page.html.lower() or "captcha" in page.html.lower():
        print("Detected CAPTCHA or unusual traffic warning.")
        return None, None
    
    # Check for "no results found" indicators
    if "did not match any documents" in page.html.lower() or "0 results" in page.html.lower():
        return False, 0
    
    # Try to extract result count
    result_count = 0
    try:
        # Look for the result stats text (e.g., "About 45 results")
        result_text = page.ele('xpath://div[@id="result-stats"]').text
        if result_text:
            # Extract number from text like "About 45 results (0.47 seconds)"
            match = re.search(r'([\d,]+)\s+results?', result_text)
            if match:
                result_count = int(match.group(1).replace(',', ''))
    except Exception as e:
        print(f"Error extracting result count: {str(e)}")
    
    return True, result_count

def submit_to_google():
    # Configure browser options
    co = ChromiumOptions()
    co.set_argument('--disable-gpu')
    co.set_argument('--disable-dev-shm-usage')
    co.set_argument('--no-sandbox')
    co.set_argument('--disable-extensions')
    co.set_argument('--disable-infobars')
    co.set_argument('--disable-notifications')
    co.set_argument('--disable-popup-blocking')
    co.set_argument('--disable-blink-features=AutomationControlled')
    co.set_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36')
    co.set_page_load_timeout(DRISSIONPAGE_TIMEOUT)
    
    # Initialize browser
    page = ChromiumPage(co)
    
    # Load URLs from file
    with open('urls.txt', 'r') as f:
        urls = [line.strip() for line in f.readlines()]
    
    # Load index database
    index_db = load_index_database()
    
    # Create a log file for submissions
    log_filename = f"submission_log_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    
    print(f"Starting submission of {len(urls)} URLs to Google")
    print(f"Logging results to {log_filename}")
    print(f"Using index database to track indexed status")
    
    successful = 0
    failed = 0
    skipped = 0
    indexed = 0
    
    with open(log_filename, 'w') as log_file:
        log_file.write(f"Submission started at {datetime.datetime.now()}\n")
        log_file.write(f"Total URLs to submit: {len(urls)}\n\n")
        
        for i, url in enumerate(urls, 1):
            try:
                # Check if URL is already in database and indexed
                current_time = datetime.datetime.now()
                if url in index_db and index_db[url].get('indexed', False):
                    # URL is already indexed, skip submission
                    log_message = f"[{i}/{len(urls)}] SKIPPED: {url} (already indexed with {index_db[url].get('result_count', 0)} results)"
                    print(log_message)
                    log_file.write(f"{current_time} - {log_message}\n")
                    skipped += 1
                    continue
                
                # Log the attempt
                log_message = f"[{i}/{len(urls)}] Checking index status: {url}"
                print(log_message)
                log_file.write(f"{current_time} - {log_message}\n")
                
                # Check if the URL is indexed
                is_indexed, result_count = check_indexed_status(page, url)
                
                # Handle CAPTCHA detection
                if is_indexed is None:
                    error_msg = "Detected CAPTCHA or unusual traffic warning. Pausing for longer..."
                    print(error_msg)
                    log_file.write(f"{current_time} - ERROR: {error_msg}\n")
                    time.sleep(300)  # 5 minute pause
                    failed += 1
                    continue
                
                # Update database with latest check
                if url not in index_db:
                    index_db[url] = {}
                
                index_db[url].update({
                    'last_checked': current_time.isoformat(),
                    'indexed': is_indexed,
                    'result_count': result_count
                })
                
                if is_indexed:
                    # URL is already indexed, no need to submit
                    log_message = f"[{i}/{len(urls)}] INDEXED: {url} (found {result_count} results)"
                    print(log_message)
                    log_file.write(f"{current_time} - {log_message}\n")
                    indexed += 1
                else:
                    # URL is not indexed, proceed with submission
                    log_message = f"[{i}/{len(urls)}] SUBMITTING: {url} (not indexed, 0 results)"
                    print(log_message)
                    log_file.write(f"{current_time} - {log_message}\n")
                    
                    # Navigate to the search URL again to submit it
                    search_url = f"https://www.google.com/search?q=site:{url}"
                    page.get(search_url)
                    time.sleep(2)
                    
                    # Check if we hit a CAPTCHA after submission
                    if "unusual traffic" in page.html.lower() or "captcha" in page.html.lower():
                        error_msg = "Detected CAPTCHA or unusual traffic warning after submission. Pausing for longer..."
                        print(error_msg)
                        log_file.write(f"{current_time} - ERROR: {error_msg}\n")
                        time.sleep(300)  # 5 minute pause
                        failed += 1
                        continue
                    
                    # Log success
                    successful += 1
                    log_file.write(f"{current_time} - SUCCESS: Submitted {url}\n")
                
                # Rate limiting logic
                if i % GOOGLE_SEARCH_LIMIT == 0:
                    pause_time = get_random_delay(60)  # Longer pause every GOOGLE_SEARCH_LIMIT submissions
                    log_file.write(f"{datetime.datetime.now()} - INFO: Rate limit pause for {pause_time} seconds\n")
                    print(f"Rate limit reached. Pausing for {pause_time} seconds...")
                    time.sleep(pause_time)
                else:
                    delay = get_random_delay(REQUEST_DELAY)
                    time.sleep(delay)
                    
            except Exception as e:
                error_msg = f"Failed to submit {url}: {str(e)}"
                print(error_msg)
                log_file.write(f"{datetime.datetime.now()} - ERROR: {error_msg}\n")
                failed += 1
                time.sleep(get_random_delay(REQUEST_DELAY))
        
        # Write summary
        summary = f"\nSubmission completed at {datetime.datetime.now()}\n"
        summary += f"Total URLs: {len(urls)}\n"
        summary += f"Already indexed: {indexed}\n"
        summary += f"Skipped (previously indexed): {skipped}\n"
        summary += f"Submitted: {successful}\n"
        summary += f"Failed: {failed}\n"
        
        print(summary)
        log_file.write(summary)
        
    # Save the updated index database
    save_index_database(index_db)
    
    # Close the browser
    page.quit()

if __name__ == '__main__':
    submit_to_google()