/**
 * Cloudflare Worker for Enterprise URL Submission
 * 
 * This worker handles large volumes of URLs and domains for enterprise users,
 * splitting them into manageable batches and triggering GitHub Actions workflows.
 * 
 * Enhanced features:
 * - Support for scheduled cron jobs
 * - Manual workflow triggering
 * - GitHub repository secrets management
 * - Integration with dashboard for API calls
 */

// Configuration constants
const MAX_URLS_PER_BATCH = 10000; // Maximum URLs per batch
const GITHUB_API_URL = 'https://api.github.com/repos/OWNER/REPO/dispatches';
const GITHUB_SECRETS_API_URL = 'https://api.github.com/repos/OWNER/REPO/actions/secrets';
const GITHUB_WORKFLOWS_API_URL = 'https://api.github.com/repos/OWNER/REPO/actions/workflows';

// Supported workflow types
const WORKFLOW_TYPES = {
  URL_SUBMISSION: 'submit-to-google.yml',
  SITEMAP_VALIDATION: 'validate-sitemap.yml',
  BATCH_SUBMISSION: 'enterprise-batch-submit.yml',
  INDEX_CHECK: 'index.yml'
};

// Cron schedule presets
const CRON_PRESETS = {
  HOURLY: '0 * * * *',
  DAILY: '0 0 * * *',
  WEEKLY: '0 0 * * 0',
  MONTHLY: '0 0 1 * *'
};

/**
 * Main request handler
 */
async function handleRequest(request) {
  // CORS headers for cross-origin requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  // Parse URL to determine the endpoint
  const url = new URL(request.url);
  const endpoint = url.pathname.split('/').filter(Boolean)[0] || 'default';
  
  try {
    let result;
    
    // Handle different endpoints
    switch (endpoint) {
      case 'submit':
        // Original URL/domain submission functionality
        if (request.method !== 'POST') {
          return methodNotAllowed(corsHeaders);
        }
        
        const submitData = await request.json();
        result = await handleSubmission(submitData);
        break;
        
      case 'cron':
        // Handle cron job configuration
        if (request.method === 'GET') {
          result = await listCronJobs();
        } else if (request.method === 'POST') {
          const cronData = await request.json();
          result = await createCronJob(cronData);
        } else if (request.method === 'PUT') {
          const cronData = await request.json();
          result = await updateCronJob(cronData);
        } else if (request.method === 'DELETE') {
          const cronData = await request.json();
          result = await deleteCronJob(cronData);
        } else {
          return methodNotAllowed(corsHeaders);
        }
        break;
        
      case 'workflow':
        // Handle manual workflow triggering
        if (request.method !== 'POST') {
          return methodNotAllowed(corsHeaders);
        }
        
        const workflowData = await request.json();
        result = await triggerWorkflow(workflowData);
        break;
        
      case 'secrets':
        // Handle GitHub secrets management
        if (request.method === 'GET') {
          result = { message: 'Secret names retrieved successfully', secrets: await listSecretNames() };
        } else if (request.method === 'POST') {
          const secretData = await request.json();
          result = await createOrUpdateSecret(secretData);
        } else if (request.method === 'DELETE') {
          const secretData = await request.json();
          result = await deleteSecret(secretData);
        } else {
          return methodNotAllowed(corsHeaders);
        }
        break;
        
      case 'status':
        // Check worker status and configuration
        if (request.method !== 'GET') {
          return methodNotAllowed(corsHeaders);
        }
        
        result = {
          status: 'active',
          version: '2.0.0',
          features: ['url_submission', 'domain_processing', 'cron_jobs', 'workflow_triggers', 'secrets_management']
        };
        break;
        
      default:
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
          status: 404,
          headers: corsHeaders
        });
    }

    // Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    // Handle errors
    console.error('Worker error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', message: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Helper function for method not allowed responses
 */
function methodNotAllowed(corsHeaders) {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: corsHeaders
  });
}

/**
 * Handle the original submission functionality
 */
async function handleSubmission(requestData) {
  // Validate request
  if (!validateRequest(requestData)) {
    throw new Error('Invalid request format');
  }

  // Verify license key
  const licenseKey = requestData.license_key;
  const isValid = await verifyLicense(licenseKey);
  
  if (!isValid) {
    throw new Error('Invalid or expired license key');
  }

  // Process the request based on type
  if (requestData.type === 'urls') {
    return await processUrls(requestData.urls, licenseKey);
  } else if (requestData.type === 'domains') {
    return await processDomains(requestData.domains, licenseKey);
  }
  
  throw new Error('Unknown submission type');
}

/**
 * Validate the incoming request format
 */
function validateRequest(data) {
  // Check if required fields exist
  if (!data || !data.license_key || !data.type) {
    return false;
  }

  // Check request type and corresponding data
  if (data.type === 'urls' && (!Array.isArray(data.urls) || data.urls.length === 0)) {
    return false;
  }
  
  if (data.type === 'domains' && (!Array.isArray(data.domains) || data.domains.length === 0)) {
    return false;
  }

  return true;
}

/**
 * Verify the license key is valid and has required privileges
 */
async function verifyLicense(licenseKey, requiredRole = 'user') {
  // In production, this should call your license verification API
  // For now, we'll do a simple check for license keys
  
  if (!licenseKey || licenseKey.length < 20) {
    return false;
  }
  
  const parts = licenseKey.split('-');
  if (parts.length < 4) {
    return false;
  }
  
  // Check if the plan level is sufficient for the required role
  const plan = parts[0].toLowerCase();
  
  // Define plan levels and their corresponding roles
  const planLevels = {
    'free': ['user'],
    'basic': ['user'],
    'premium': ['user', 'manager'],
    'business': ['user', 'manager', 'admin'],
    'enterprise': ['user', 'manager', 'admin', 'superadmin']
  };
  
  // Check if the plan exists and if it has the required role
  if (!planLevels[plan] || !planLevels[plan].includes(requiredRole)) {
    return false;
  }
  
  // Additional validation could be done here, such as checking expiration date
  // For now, we'll just return true if the plan level is sufficient
  return true;
}

/**
 * Process a list of URLs by splitting into batches and triggering workflows
 */
async function processUrls(urls, licenseKey) {
  // Remove duplicates
  const uniqueUrls = [...new Set(urls)];
  
  // Split URLs into batches
  const batches = [];
  for (let i = 0; i < uniqueUrls.length; i += MAX_URLS_PER_BATCH) {
    batches.push(uniqueUrls.slice(i, i + MAX_URLS_PER_BATCH));
  }
  
  // Trigger GitHub Actions workflow for each batch
  const results = await Promise.all(batches.map((batch, index) => 
    triggerGitHubWorkflow({
      type: 'url_batch',
      batch_index: index + 1,
      total_batches: batches.length,
      urls: batch,
      license_key: licenseKey
    })
  ));
  
  return {
    success: true,
    message: `Split ${uniqueUrls.length} URLs into ${batches.length} batches`,
    batches: batches.length,
    batch_results: results
  };
}

/**
 * Process a list of domains by triggering workflows
 */
async function processDomains(domains, licenseKey) {
  // Remove duplicates
  const uniqueDomains = [...new Set(domains)];
  
  // Split domains into batches if there are too many
  const batches = [];
  for (let i = 0; i < uniqueDomains.length; i += 100) { // Process 100 domains per batch
    batches.push(uniqueDomains.slice(i, i + 100));
  }
  
  // Trigger GitHub Actions workflow for each batch
  const results = await Promise.all(batches.map((batch, index) => 
    triggerGitHubWorkflow({
      type: 'domain_batch',
      batch_index: index + 1,
      total_batches: batches.length,
      domains: batch,
      license_key: licenseKey
    })
  ));
  
  return {
    success: true,
    message: `Processing ${uniqueDomains.length} domains in ${batches.length} batches`,
    batches: batches.length,
    batch_results: results
  };
}

/**
 * List all configured cron jobs
 */
async function listCronJobs() {
  // In a production environment, this would fetch from a database or KV store
  // For now, we'll return a sample response
  return {
    success: true,
    cron_jobs: [
      {
        id: 'daily-sitemap-validation',
        workflow: WORKFLOW_TYPES.SITEMAP_VALIDATION,
        schedule: CRON_PRESETS.DAILY,
        domains: ['example.com', 'example.org'],
        active: true,
        last_run: '2023-06-15T00:00:00Z',
        next_run: '2023-06-16T00:00:00Z'
      },
      {
        id: 'weekly-batch-submission',
        workflow: WORKFLOW_TYPES.BATCH_SUBMISSION,
        schedule: CRON_PRESETS.WEEKLY,
        domains: ['example.net'],
        active: true,
        last_run: '2023-06-11T00:00:00Z',
        next_run: '2023-06-18T00:00:00Z'
      }
    ]
  };
}

/**
 * Create a new cron job
 */
async function createCronJob(data) {
  // Validate the cron job data
  if (!data.workflow || !data.schedule || !data.domains) {
    throw new Error('Missing required cron job parameters');
  }
  
  // Verify the license key allows cron jobs
  if (!await verifyLicense(data.license_key)) {
    throw new Error('Invalid or expired license key');
  }
  
  // In production, this would store the cron job in a database or KV store
  // and set up the actual cron trigger
  
  // Generate a unique ID for the cron job
  const cronId = 'cron-' + Date.now();
  
  // For now, we'll return a success response with the new cron job details
  return {
    success: true,
    message: 'Cron job created successfully',
    cron_job: {
      id: cronId,
      workflow: data.workflow,
      schedule: data.schedule,
      domains: data.domains,
      active: true,
      created_at: new Date().toISOString(),
      next_run: calculateNextRunTime(data.schedule)
    }
  };
}

/**
 * Update an existing cron job
 */
async function updateCronJob(data) {
  // Validate the update data
  if (!data.id) {
    throw new Error('Missing cron job ID');
  }
  
  // Verify the license key
  if (!await verifyLicense(data.license_key)) {
    throw new Error('Invalid or expired license key');
  }
  
  // In production, this would update the cron job in a database or KV store
  
  // For now, we'll return a success response
  return {
    success: true,
    message: 'Cron job updated successfully',
    cron_job: {
      id: data.id,
      workflow: data.workflow || WORKFLOW_TYPES.URL_SUBMISSION,
      schedule: data.schedule || CRON_PRESETS.DAILY,
      domains: data.domains || [],
      active: data.active !== undefined ? data.active : true,
      updated_at: new Date().toISOString(),
      next_run: calculateNextRunTime(data.schedule || CRON_PRESETS.DAILY)
    }
  };
}

/**
 * Delete a cron job
 */
async function deleteCronJob(data) {
  // Validate the delete request
  if (!data.id) {
    throw new Error('Missing cron job ID');
  }
  
  // Verify the license key
  if (!await verifyLicense(data.license_key)) {
    throw new Error('Invalid or expired license key');
  }
  
  // In production, this would delete the cron job from a database or KV store
  
  // For now, we'll return a success response
  return {
    success: true,
    message: 'Cron job deleted successfully',
    id: data.id
  };
}

/**
 * Calculate the next run time based on a cron schedule
 */
function calculateNextRunTime(schedule) {
  // This is a simplified implementation
  // In production, you would use a proper cron parser
  
  const now = new Date();
  let nextRun = new Date(now);
  
  // Simple handling for our preset schedules
  if (schedule === CRON_PRESETS.HOURLY) {
    nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0);
  } else if (schedule === CRON_PRESETS.DAILY) {
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(0, 0, 0, 0);
  } else if (schedule === CRON_PRESETS.WEEKLY) {
    nextRun.setDate(nextRun.getDate() + (7 - nextRun.getDay()));
    nextRun.setHours(0, 0, 0, 0);
  } else if (schedule === CRON_PRESETS.MONTHLY) {
    nextRun.setMonth(nextRun.getMonth() + 1);
    nextRun.setDate(1);
    nextRun.setHours(0, 0, 0, 0);
  }
  
  return nextRun.toISOString();
}

/**
 * Manually trigger a GitHub workflow
 */
async function triggerWorkflow(data) {
  // Validate the workflow trigger data
  if (!data.workflow || (!data.domains && !data.urls)) {
    throw new Error('Missing required workflow parameters');
  }
  
  // Verify the license key
  if (!await verifyLicense(data.license_key)) {
    throw new Error('Invalid or expired license key');
  }
  
  // Determine the workflow file to trigger
  let workflowFile;
  if (Object.values(WORKFLOW_TYPES).includes(data.workflow)) {
    workflowFile = data.workflow;
  } else {
    // Default to URL submission workflow
    workflowFile = WORKFLOW_TYPES.URL_SUBMISSION;
  }
  
  // Prepare the payload for the GitHub API
  const payload = {
    workflow_type: workflowFile,
    license_key: data.license_key,
    manual_trigger: true,
    trigger_time: new Date().toISOString()
  };
  
  // Add domains or URLs to the payload
  if (data.domains) {
    payload.domains = Array.isArray(data.domains) ? data.domains : [data.domains];
  }
  
  if (data.urls) {
    payload.urls = Array.isArray(data.urls) ? data.urls : [data.urls];
  }
  
  // Trigger the workflow
  const result = await triggerGitHubWorkflow(payload);
  
  return {
    success: true,
    message: 'Workflow triggered successfully',
    workflow: workflowFile,
    trigger_details: result
  };
}

/**
 * List available GitHub secret names (not values)
 */
async function listSecretNames() {
  // In production, this would call the GitHub API to list secrets
  // For security, we only return names, not values
  
  // Sample response
  return [
    'GOOGLE_API_KEY',
    'BING_API_KEY',
    'CLOUDFLARE_API_TOKEN',
    'NAMECHEAP_API_KEY',
    'GODADDY_API_KEY'
  ];
}

/**
 * Create or update a GitHub repository secret
 */
async function createOrUpdateSecret(data) {
  // Validate the secret data
  if (!data.name || !data.value) {
    throw new Error('Missing required secret parameters');
  }
  
  // Verify the license key has admin privileges
  if (!await verifyLicense(data.license_key, 'admin')) {
    throw new Error('Invalid license key or insufficient privileges');
  }
  
  // In production, this would call the GitHub API to create/update the secret
  
  return {
    success: true,
    message: `Secret ${data.name} created/updated successfully`,
    name: data.name,
    created_at: new Date().toISOString()
  };
}

/**
 * Delete a GitHub repository secret
 */
async function deleteSecret(data) {
  // Validate the delete request
  if (!data.name) {
    throw new Error('Missing secret name');
  }
  
  // Verify the license key has admin privileges
  if (!await verifyLicense(data.license_key, 'admin')) {
    throw new Error('Invalid license key or insufficient privileges');
  }
  
  // In production, this would call the GitHub API to delete the secret
  
  return {
    success: true,
    message: `Secret ${data.name} deleted successfully`,
    name: data.name
  };
}

/**
 * Trigger a GitHub Actions workflow via repository_dispatch event
 */
async function triggerGitHubWorkflow(payload) {
  // In production, this should use your GitHub token from environment variables
  const githubToken = GITHUB_TOKEN;
  
  try {
    // This is a placeholder for the actual GitHub API call
    // In production, uncomment the fetch code below and set proper credentials
    
    /*
    const response = await fetch(GITHUB_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_type: 'url_submission',
        client_payload: payload
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error: ${response.status} ${errorText}`);
    }
    
    return {
      success: true,
      status: response.status,
      batch_index: payload.batch_index
    };
    */
    
    // Simulated success response for now
    return {
      success: true,
      simulated: true,
      batch_index: payload.batch_index
    };
    
  } catch (error) {
    console.error('Error triggering workflow:', error);
    return {
      success: false,
      error: error.message,
      batch_index: payload.batch_index
    };
  }
}

// Register the request handler
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});