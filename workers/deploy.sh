#!/bin/bash

# Make sure you have Wrangler CLI installed
# npm install -g @cloudflare/wrangler

# Deploy the worker
echo "Deploying Auto Submit Site Auth worker..."
wrangler publish

echo "Done!" 