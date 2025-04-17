# GitHub Action to Submit "site:{url}" to Google Search

This tool automatically submits your domains and URLs to Google Search using the "site:" operator to help with indexing. It runs as a GitHub Action on a schedule or can be triggered manually.

## Features

- **Comprehensive Domain Collection**: Fetches all domains and subdomains from your Cloudflare account
- **Intelligent Sitemap Parsing**: Extracts URLs from sitemaps, including nested sitemaps and sitemap indexes
- **Fallback Mechanisms**: If no sitemap is found, extracts links from the homepage
- **Smart Rate Limiting**: Implements delays and randomization to avoid triggering CAPTCHAs
- **Detailed Logging**: Keeps track of all submissions and their status
- **Google Search Console Support**: Submit URLs directly via Google Search Console API

## How It Works

1. **Domain Collection**: Uses the Cloudflare API to fetch all domains and subdomains in your account
2. **URL Extraction**: Parses sitemaps for each domain to extract all URLs
3. **Google Submission**: Submits each URL to Google using either:
   - The "site:" operator through a browser automation (default method)
   - Direct submission via Google Search Console API (new feature)

## Setup Instructions

1. **Fork this repository** to your GitHub account

2. **Set up GitHub Secrets**:
   - Go to your repository Settings > Secrets and variables > Actions
   - Add the following secrets:
     - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with read permissions
     - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID (found in the Cloudflare dashboard URL)
     - Optional: `MAX_URLS_PER_RUN`, `REQUEST_DELAY`, `GOOGLE_SEARCH_LIMIT`, `DRISSIONPAGE_TIMEOUT`
     - For Google Search Console API (optional):
       - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`: Private key from your Google service account
       - `GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL`: Client email from your Google service account
       - `SERVICE_ACCOUNT_JSON_BASE64`: Base64-encoded service account JSON file (alternative to the above)

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

### Environment Variables

All configuration can be set through environment variables or GitHub Secrets:

| Variable | Description | Default |
|----------|-------------|--------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with read permissions | Required |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID | Required |
| `MAX_URLS_PER_RUN` | Maximum number of URLs to process per run | 100 |
| `REQUEST_DELAY` | Delay between requests in seconds | 5 |
| `GOOGLE_SEARCH_LIMIT` | Max submissions per minute before longer pause | 10 |
| `DRISSIONPAGE_TIMEOUT` | Browser timeout in seconds | 30 |
| `USE_GSC_API` | Whether to use Google Search Console API | false |
| `SUBMIT_SITEMAP` | Whether to submit sitemap to GSC | false |
| `GOOGLE_SERVICE_ACCOUNT_FILE` | Path to Google service account JSON file | service_account.json |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Private key from service account | Optional |
| `GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL` | Client email from service account | Optional |

### Google Search Console API Setup

To use the Google Search Console API for direct URL submission:

1. Create a Google Cloud Project
2. Enable the Google Search Console API
3. Create a Service Account with appropriate permissions
4. Download the service account JSON key file
5. Add the service account email to your Google Search Console property
6. Configure the tool to use the API by setting `USE_GSC_API=true`

Detailed instructions:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Library"
4. Search for and enable "Google Search Console API"
5. Go to "IAM & Admin" > "Service Accounts"
6. Create a new service account with a descriptive name
7. Grant the service account the "Owner" role
8. Create a new JSON key for the service account and download it
9. In Google Search Console, add the service account email as a user with "Owner" permissions
10. Set up the environment variables as described above

| Environment Variable | Description | Default |
|----------------------|-------------|--------|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token | Required |
| `MAX_URLS_PER_RUN` | Maximum URLs to submit per run (0 for unlimited) | 100 |
| `REQUEST_DELAY` | Seconds between requests | 5 |
| `GOOGLE_SEARCH_LIMIT` | Max submissions per minute | 10 |
| `DRISSIONPAGE_TIMEOUT` | Browser timeout in seconds | 30 |

# Future Plans

See [task.md](task.md) for detailed information about our future plans and roadmap.

# License

This project is licensed under a custom license that allows free use for personal and internal business purposes, but **prohibits** using the code to build competing commercial products. Please see the [LICENSE](LICENSE) file for full details.

If you wish to use this software in a way not covered by the license, please contact us for permission.





add support to https://www.bing.com/webmasters/pubhub?siteUrl=https://38smile.heytcm.com/&source=bwtcard
