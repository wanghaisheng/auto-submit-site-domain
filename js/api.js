/**
 * API Integration for Dashboard
 * 
 * This file handles all API communications between the dashboard and Cloudflare Worker
 * It provides functions for triggering workflows, managing cron jobs, and handling submissions
 */

// Configuration
const API_BASE_URL = 'https://your-worker-url.workers.dev'; // Replace with actual Cloudflare Worker URL

// API Endpoints
const ENDPOINTS = {
  SUBMIT: '/submit',
  WORKFLOW: '/workflow',
  CRON: '/cron',
  SECRETS: '/secrets',
  STATUS: '/status'
};

/**
 * Generic API request function
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} data - Request payload
 * @returns {Promise} - API response
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    credentials: 'same-origin'
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '请求失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

/**
 * Submit URLs or domains to Google
 * @param {Object} data - Submission data
 * @returns {Promise} - Submission result
 */
async function submitToGoogle(data) {
  return apiRequest(ENDPOINTS.SUBMIT, 'POST', data);
}

/**
 * Trigger a specific workflow
 * @param {Object} data - Workflow data
 * @returns {Promise} - Workflow trigger result
 */
async function triggerWorkflow(data) {
  return apiRequest(ENDPOINTS.WORKFLOW, 'POST', data);
}

/**
 * Get all scheduled cron jobs
 * @returns {Promise} - List of cron jobs
 */
async function getCronJobs() {
  return apiRequest(ENDPOINTS.CRON, 'GET');
}

/**
 * Create a new cron job
 * @param {Object} data - Cron job data
 * @returns {Promise} - Creation result
 */
async function createCronJob(data) {
  return apiRequest(ENDPOINTS.CRON, 'POST', data);
}

/**
 * Update an existing cron job
 * @param {Object} data - Updated cron job data
 * @returns {Promise} - Update result
 */
async function updateCronJob(data) {
  return apiRequest(ENDPOINTS.CRON, 'PUT', data);
}

/**
 * Delete a cron job
 * @param {Object} data - Cron job identifier
 * @returns {Promise} - Deletion result
 */
async function deleteCronJob(data) {
  return apiRequest(ENDPOINTS.CRON, 'DELETE', data);
}

/**
 * Get worker status
 * @returns {Promise} - Worker status
 */
async function getWorkerStatus() {
  return apiRequest(ENDPOINTS.STATUS, 'GET');
}

/**
 * Format submission data for display
 * @param {Array} submissions - Raw submission data
 * @returns {Array} - Formatted submission data
 */
function formatSubmissionData(submissions) {
  return submissions.map(submission => ({
    id: submission.id,
    date: new Date(submission.timestamp).toLocaleString(),
    type: submission.type,
    status: submission.status,
    count: submission.urls?.length || submission.domains?.length || 0,
    success: submission.success_count || 0,
    failed: submission.failed_count || 0
  }));
}

/**
 * Format cron job data for display
 * @param {Array} cronJobs - Raw cron job data
 * @returns {Array} - Formatted cron job data
 */
function formatCronJobData(cronJobs) {
  return cronJobs.map(job => ({
    id: job.id,
    name: job.name,
    schedule: job.schedule,
    workflow: job.workflow,
    lastRun: job.last_run ? new Date(job.last_run).toLocaleString() : '从未运行',
    nextRun: job.next_run ? new Date(job.next_run).toLocaleString() : '未计划',
    status: job.status
  }));
}

// Export all functions
export {
  submitToGoogle,
  triggerWorkflow,
  getCronJobs,
  createCronJob,
  updateCronJob,
  deleteCronJob,
  getWorkerStatus,
  formatSubmissionData,
  formatCronJobData
};