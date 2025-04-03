/**
 * Auth Worker for Auto Submit Site Domain
 * Handles authentication using Cloudflare KV for user storage
 */

// Configure the KV namespace binding in your wrangler.toml
// [kv_namespaces]
// binding = "AUTH_USERS"

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Handle all requests to the worker
 * @param {Request} request
 */
async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCORS(request)
  }
  
  // Route requests based on the path
  if (url.pathname === '/api/login') {
    return handleLogin(request)
  } else if (url.pathname === '/api/verify') {
    return verifyToken(request)
  } else if (url.pathname === '/api/register' && request.method === 'POST') {
    return handleRegistration(request)
  }
  
  // Return 404 for all other routes
  return new Response('Not found', { status: 404 })
}

/**
 * Handle CORS preflight requests
 */
function handleCORS(request) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

/**
 * Handle login requests
 * @param {Request} request 
 */
async function handleLogin(request) {
  // Only allow POST requests for login
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }
  
  try {
    // Parse the request body
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return jsonResponse({ 
        success: false, 
        message: 'Email and password are required' 
      }, 400)
    }
    
    // Fetch the user from KV storage
    const userData = await AUTH_USERS.get(email, { type: 'json' })
    
    // If user not found or password doesn't match
    if (!userData || userData.password !== hashPassword(password)) {
      return jsonResponse({ 
        success: false, 
        message: 'Invalid email or password' 
      }, 401)
    }
    
    // Create a simple token (in production, use proper JWT)
    const token = generateToken(email)
    
    // Store the token in KV with an expiration
    await AUTH_USERS.put(`token:${token}`, JSON.stringify({
      email,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }), { expirationTtl: 86400 }) // 24 hours in seconds
    
    // Return success with token
    return jsonResponse({
      success: true,
      token,
      user: {
        email: userData.email,
        name: userData.name
      }
    })
    
  } catch (error) {
    return jsonResponse({ 
      success: false, 
      message: 'An error occurred during login' 
    }, 500)
  }
}

/**
 * Handle user registration
 * @param {Request} request 
 */
async function handleRegistration(request) {
  try {
    // Parse the request body
    const { email, password, name } = await request.json()
    
    if (!email || !password || !name) {
      return jsonResponse({ 
        success: false, 
        message: 'Email, password and name are required' 
      }, 400)
    }
    
    // Check if user already exists
    const existingUser = await AUTH_USERS.get(email)
    if (existingUser) {
      return jsonResponse({ 
        success: false, 
        message: 'User already exists' 
      }, 409)
    }
    
    // Store the new user in KV
    await AUTH_USERS.put(email, JSON.stringify({
      email,
      name,
      password: hashPassword(password), // Store hashed password
      created: Date.now()
    }))
    
    return jsonResponse({
      success: true,
      message: 'User registered successfully'
    })
    
  } catch (error) {
    return jsonResponse({ 
      success: false, 
      message: 'An error occurred during registration' 
    }, 500)
  }
}

/**
 * Verify a token is valid
 * @param {Request} request 
 */
async function verifyToken(request) {
  // Get token from Authorization header
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ 
      success: false, 
      message: 'Authorization header missing or invalid' 
    }, 401)
  }
  
  const token = authHeader.split(' ')[1]
  
  // Look up the token in KV
  const tokenData = await AUTH_USERS.get(`token:${token}`, { type: 'json' })
  
  // If token not found or expired
  if (!tokenData || tokenData.expires < Date.now()) {
    return jsonResponse({ 
      success: false, 
      message: 'Invalid or expired token' 
    }, 401)
  }
  
  // Get the user data
  const userData = await AUTH_USERS.get(tokenData.email, { type: 'json' })
  
  return jsonResponse({
    success: true,
    user: {
      email: userData.email,
      name: userData.name
    }
  })
}

/**
 * Simple password hashing function
 * In production, use a proper hashing algorithm like bcrypt
 * @param {string} password 
 * @returns {string} hashed password
 */
function hashPassword(password) {
  // This is a placeholder - in production use proper hashing
  // For example with crypto APIs or proper hashing algorithms
  return `hashed_${password}_${HASH_SECRET}`
}

/**
 * Generate a simple authentication token
 * In production, use proper JWT with signing
 * @param {string} email 
 * @returns {string} authentication token
 */
function generateToken(email) {
  // This is a placeholder - in production use proper JWT
  const random = Math.random().toString(36).substring(2, 15)
  return `${btoa(email)}.${random}.${Date.now()}`
}

/**
 * Helper function to return JSON responses
 * @param {Object} data 
 * @param {number} status 
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
} 