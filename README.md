# GitHub Action to Submit "site:{url}" to Google Search

This tool automatically submits your domains and URLs to Google Search using the "site:" operator to help with indexing. It runs as a GitHub Action on a schedule or can be triggered manually.

## Features

- **Comprehensive Domain Collection**: Fetches all domains and subdomains from your Cloudflare account
- **Intelligent Sitemap Parsing**: Extracts URLs from sitemaps, including nested sitemaps and sitemap indexes
- **Fallback Mechanisms**: If no sitemap is found, extracts links from the homepage
- **Smart Rate Limiting**: Implements delays and randomization to avoid triggering CAPTCHAs
- **Detailed Logging**: Keeps track of all submissions and their status

## How It Works

1. **Domain Collection**: Uses the Cloudflare API to fetch all domains and subdomains in your account
2. **URL Extraction**: Parses sitemaps for each domain to extract all URLs
3. **Google Submission**: Submits each URL to Google using the "site:" operator

## Setup Instructions

1. **Fork this repository** to your GitHub account

2. **Set up GitHub Secrets**:
   - Go to your repository Settings > Secrets and variables > Actions
   - Add the following secrets:
     - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with read permissions
     - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID (found in the Cloudflare dashboard URL)
     - Optional: `MAX_URLS_PER_RUN`, `REQUEST_DELAY`, `GOOGLE_SEARCH_LIMIT`, `DRISSIONPAGE_TIMEOUT`

3. **Customize the workflow** (optional):
   - Edit `.github/workflows/submit-to-google.yml` to change the schedule

4. **Run the workflow**:
   - The workflow runs automatically according to the schedule
   - You can also trigger it manually from the Actions tab

## Local Development

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Cloudflare API token
3. Install dependencies: `pip install -r requirements.txt`
4. Run the scripts in sequence:
   ```
   python cloudflare_fetcher.py
   python sitemap_parser.py
   python submit_to_google.py
   ```

## Configuration Options

| Environment Variable | Description | Default |
|----------------------|-------------|--------|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token | Required |
| `MAX_URLS_PER_RUN` | Maximum URLs to submit per run (0 for unlimited) | 100 |
| `REQUEST_DELAY` | Seconds between requests | 5 |
| `GOOGLE_SEARCH_LIMIT` | Max submissions per minute | 10 |
| `DRISSIONPAGE_TIMEOUT` | Browser timeout in seconds | 30 |


