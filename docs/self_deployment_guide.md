# Self-Deployment Guide for Site Submission Tool

This comprehensive guide will help you set up and deploy the site submission tool on your own GitHub repository. By following these instructions, you'll be able to manage unlimited domains and URLs for submission to search engines.

## Prerequisites

- GitHub account
- Basic knowledge of GitHub Actions
- API keys for the services you plan to use (Cloudflare, Namecheap, GoDaddy, etc.)
- Google Search Console access
- Bing Webmaster Tools access (optional)

## Step 1: Fork or Clone the Repository

1. Visit the original repository at [GitHub URL]
2. Click the "Fork" button to create your own copy of the repository
3. Alternatively, clone the repository and push it to your own GitHub account

## Step 2: Configure Repository Secrets

You'll need to add several secrets to your GitHub repository to enable the various API integrations:

1. Go to your repository on GitHub
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Add the following secrets as needed:

### Required Secrets
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Zone Read permission
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

### Optional Secrets (Based on Your Configuration)
- `BING_API_KEY`: Your Bing Webmaster Tools API key
- `NAMECHEAP_API_KEY`: Your Namecheap API key
- `NAMECHEAP_USERNAME`: Your Namecheap username
- `NAMECHEAP_CLIENT_IP`: Your client IP address for Namecheap API
- `GODADDY_API_KEY`: Your GoDaddy API key
- `GODADDY_API_SECRET`: Your GoDaddy API secret

### Performance Configuration
- `MAX_URLS_PER_RUN`: Maximum number of URLs to process per run (default: 100)
- `REQUEST_DELAY`: Delay between API requests in seconds (default: 5)
- `GOOGLE_SEARCH_LIMIT`: Maximum number of Google submissions per minute (default: 10)
- `DRISSIONPAGE_TIMEOUT`: Browser automation timeout in seconds (default: 30)

## Step 3: Customize Configuration

1. Edit the `config.json` file to match your requirements:

```json
{
  "domain_whitelist": ["example.com", "example.org"],
  "domain_blacklist": ["test.com"],
  "use_domain_file": false,
  "domain_file_path": "domains_list.txt",
  "url_limit_per_domain": 1000,
  "submit_not_indexed": true,
  "submit_sitemap": true,
  "split_large_domains": false,
  "max_urls_per_piece": 10000,
  "bing_submission": true,
  "use_namecheap": false,
  "use_godaddy": false
}
```

2. Commit and push your changes to the repository

## Step 4: Configure GitHub Actions Workflow

1. The workflow file is located at `.github/workflows/submit-to-google.yml`
2. You can customize the schedule by modifying the cron expression:

```yaml
on:
  schedule:
    - cron: '0 12 * * *'  # Runs daily at 12:00 UTC
  workflow_dispatch:  # Allow manual triggering
```

3. You can also customize the Python version, dependencies, or add additional steps as needed

## Step 5: Run the Workflow

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Submit to Google" workflow
3. Click "Run workflow" to trigger it manually for the first time
4. Check the logs to ensure everything is working correctly

## Step 6: Monitor and Troubleshoot

### Viewing Logs

After each workflow run, logs and results are uploaded as artifacts:

1. Go to the "Actions" tab
2. Click on the completed workflow run
3. Scroll down to the "Artifacts" section
4. Download the "submission-logs" artifact to view detailed logs

### Common Issues and Solutions

#### API Rate Limiting

**Problem**: API requests are being rate-limited

**Solution**: Increase the `REQUEST_DELAY` value in your repository secrets

#### Browser Automation Failures

**Problem**: DrissionPage browser automation fails

**Solution**:
- Increase the `DRISSIONPAGE_TIMEOUT` value
- Check the logs for specific error messages
- Ensure you're using a compatible GitHub Actions runner

#### Missing Domains

**Problem**: Expected domains are not being processed

**Solution**:
- Check your whitelist/blacklist configuration
- Verify API credentials have correct permissions
- Check the domains.txt file in the artifacts

## Step 7: Advanced Configuration

### Using Multiple Domain Providers

You can fetch domains from multiple providers by setting up the appropriate API keys and enabling them in the configuration:

```json
{
  "use_cloudflare": true,
  "use_namecheap": true,
  "use_godaddy": true
}
```

### Customizing URL Submission

You can customize how URLs are submitted by modifying the following settings:

```json
{
  "submit_not_indexed": true,  // Submit only non-indexed URLs
  "submit_sitemap": true,     // Submit sitemaps
  "google_submission": true,   // Submit to Google
  "bing_submission": true      // Submit to Bing
}
```

### Handling Large Numbers of URLs

For sites with many URLs, enable batch processing:

```json
{
  "split_large_domains": true,
  "max_urls_per_piece": 10000
}
```

## Step 8: Updating the Tool

To keep your deployment up to date with the latest features:

1. If you forked the repository, sync your fork with the upstream repository
2. If you cloned it, pull the latest changes and push to your repository
3. Check the changelog for any breaking changes or new configuration options

## Support and Resources

- For premium support, contact [support email]
- Check the [documentation](docs/) for detailed information on each component
- Visit the [issues page](issues/) to report bugs or request features

---

## Premium Features (Paid Users Only)

As a paid user, you have access to the following premium features:

- **Unlimited domains and URLs**: No restrictions on the number of domains or URLs you can submit
- **Priority support**: Get help with setup and troubleshooting
- **Advanced search engine integrations**: Submit to additional search engines beyond Google and Bing
- **Custom reporting**: Generate detailed reports on submission status and indexing progress
- **Automatic retries**: Failed submissions are automatically retried with exponential backoff

To activate these features, add your license key to the configuration:

```json
{
  "license_key": "your-premium-license-key",
  "enable_premium_features": true
}
```

---

Thank you for choosing our site submission tool! If you have any questions or need assistance, please don't hesitate to reach out.