# GitHub Action to Submit "site:{url}" to Google Search

This GitHub Action automatically submits your site URLs to Google Search using a cron python job. It supports both the "site:" operator method through browser automation and direct submission via the Google Search Console API.





## Features
- Fetches domain list from Cloudflare API
- Parses URLs from sitemap.xml
- Submits URLs to Google Search using DrissionPage

## Setup

### Prerequisites
- GitHub repository
- Cloudflare API token with Zone Read permission
- Python 3.8+

### Configuration
1. Add these secrets to your GitHub repository:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
   - `CLOUDFLARE_ZONE_ID`: Your zone ID from Cloudflare

2. Create `.github/workflows/submit-to-google.yml` with:
```yaml
name: Submit to Google
on:
  schedule:
    - cron: '0 12 * * *'  # Runs daily at 12:00 UTC
jobs:
  submit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.8'
      - name: Install dependencies
        run: |
          pip install drissionpage requests beautifulsoup4
      - name: Run submission script
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ZONE_ID: ${{ secrets.CLOUDFLARE_ZONE_ID }}
        run: python submit_to_google.py
```

## Implementation Details

### Get Domain List from Cloudflare API
The script will:
1. Authenticate using your Cloudflare API token
2. Fetch all domains in your zone
3. Filter active domains

### Get URL List from Sitemap
For each domain:
1. Fetch sitemap.xml
2. Parse all URLs using BeautifulSoup
3. Validate URLs

### Submit to Google Search
Using DrissionPage:
1. Open Google Search Console
2. Submit each URL with "site:" prefix
3. Handle rate limits and errors
```

This expanded README now includes:
1. Clear project description
2. Setup instructions
3. Sample workflow file
4. Implementation details for each component
5. Prerequisites and configuration steps


I'll help you create a more detailed task breakdown based on your existing `task.md` file. Here's an enhanced version with specific implementation steps:

```markdown:d:\Download\audio-visual\heytcm\auto-submit-site-domain\task.md
# GitHub Action to Submit "site:{url}" to Google Search

## Task Breakdown

### 1. Cloudflare Domain Fetcher
- [x] Create `cloudflare_fetcher.py` to:
  - Authenticate with Cloudflare API
  - List all domains in zone
  - Filter active domains (status: 'active')
  - Output domain list to `domains.txt`

### 2. Sitemap Parser
- [x] Create `sitemap_parser.py` to:
  - Read domains from `domains.txt`
  - For each domain:
    - Fetch `sitemap.xml`
    - Parse URLs using BeautifulSoup
    - Validate URLs (status 200)
    - Output to `urls.txt`

### 3. Google Submission Script
- [x] Create `submit_to_google.py` to:
  - Initialize DrissionPage browser
  - Read URLs from `urls.txt`
  - For each URL:
    - Open Google Search with "site:{url}"
    - Handle rate limiting (max 10 URLs/minute)
    - Log successful submissions

### 4. GitHub Action Workflow
- [x] Finalize `.github/workflows/submit-to-google.yml`:
  - Set proper cron schedule
  - Add error handling
  - Configure artifact storage for logs

## Implementation Timeline

1. **Week 1**: 
   - Complete Cloudflare integration
   - Test domain fetching locally

2. **Week 2**:
   - Implement sitemap parser
   - Validate URL collection

3. **Week 3**:
   - Build Google submission script
   - Test rate limiting

4. **Week 4**:
   - Finalize GitHub Action
   - Document all components

## Required Files
```
auto-submit-site-domain/
│
├── .github/
│   └── workflows/
│       └── submit-to-google.yml
│
├── cloudflare_fetcher.py
├── sitemap_parser.py
├── submit_to_google.py
│
├── domains.txt
├── urls.txt
└── task.md
```

## Next Steps
1. ✅ Create initial Python scripts
2. ✅ Test each component separately
3. ✅ Integrate into full workflow
4. Add more comprehensive documentation
5. Implement additional features from the Future Plans section

## Implemented Features

- **Google Search Console API Integration**: Implemented in `google_search_console.py` and integrated with `submit_to_google.py`. This provides an alternative submission method to the "site:" operator approach.

- **Domain Management Improvements**:
  - ✅ Add URL count limit per domain (implemented in config.json)
  - ✅ Add domain blacklist configuration (implemented in config.json)
  - ✅ Add domain whitelist configuration (implemented in config.json)
  - ✅ Support reading target domains from a file instead of Cloudflare API (implemented in cloudflare_fetcher.py)

- **Advanced Submission Features**:
  - ✅ Submit non-indexed URLs through Google Search Console API (implemented in google_search_console.py)
  - ✅ Use DrissionPage to submit inside Google Search Console (implemented in submit_to_google.py)
  - ✅ Add sitemap submission to Google Search Console (implemented in submit_to_google.py)
  - ✅ Support for millions of URLs by splitting into 10,000-piece batches (implemented in config.json with max_urls_per_piece)

- **Expanded Search Engine Support**:
  - Add submission to Bing and other search engines via API or browser automation

- **Additional Domain Provider Support**:
  - Add support for Namecheap, GoDaddy, and other domain providers beyond Cloudflare

- **Paid User Benefits**:
  - Lifetime updates with new features
  - Self-deployment guide for managing unlimited domains and URLs
  - Premium pricing at $5.99 USD per month (compared to RankWeek's higher pricing)

```

This version adds:
- Clear task breakdown with checkboxes
- Implementation timeline
- File structure visualization
- Specific action items for each component
- Detailed future plans and roadmap