/**
 * Authentication module for Auto Submit Site Domain
 * Works with Cloudflare Worker for authentication
 */

const AuthModule = (function() {
  // Configuration
  const config = {
    apiUrl: 'https://rankdaily.shopconna.com/workers/auth',
    tokenName: 'authToken',
    userInfoName: 'userInfo'
  };
  
  // Store user token in localStorage
  let token = localStorage.getItem(config.tokenName) || null;
  
  // Current user data
  let user = JSON.parse(localStorage.getItem(config.userInfoName)) || null;
  
  /**
   * Initialize the auth module
   */
  function init() {
    // Check if user is logged in
    if (token) {
      verifyToken(token)
        .then(userData => {
          if (userData) {
            updateUIForLoggedInUser(userData);
          } else {
            logout();
          }
        })
        .catch(error => {
          console.error('Error verifying token:', error);
          logout();
        });
    } else {
      updateUI(false);
    }
    
    // Set up the login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
    
    // Set up the registration form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', handleRegistration);
    }
    
    // Set up logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
  }
  
  /**
   * Login user with email and password
   */
  function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginError');
    
    // Reset error message
    errorElement.style.display = 'none';
    errorElement.textContent = '';
    
    // Call the login API
    fetch(`${config.apiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Store token and user info
        token = data.token;
        user = data.user;
        
        localStorage.setItem(config.tokenName, token);
        localStorage.setItem(config.userInfoName, JSON.stringify(user));
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
      } else {
        // Show error message
        errorElement.textContent = data.message || 'Login failed. Please check your credentials.';
        errorElement.style.display = 'block';
      }
    })
    .catch(error => {
      console.error('Login error:', error);
      errorElement.textContent = 'An error occurred. Please try again later.';
      errorElement.style.display = 'block';
    });
  }
  
  /**
   * Register a new user
   */
  function handleRegistration(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const errorElement = document.getElementById('registerError');
    
    // Reset error message
    errorElement.style.display = 'none';
    errorElement.textContent = '';
    
    // Validate passwords match
    if (password !== confirmPassword) {
      errorElement.textContent = 'Passwords do not match.';
      errorElement.style.display = 'block';
      return;
    }
    
    // Call the registration API
    fetch(`${config.apiUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Show success message and redirect to login
        const modal = document.getElementById('loginModal');
        const loginTab = document.getElementById('loginTab');
        
        // Switch to login tab
        if (loginTab) {
          loginTab.click();
        }
        
        // Show success message on login form
        const loginError = document.getElementById('loginError');
        loginError.textContent = 'Registration successful! Please sign in with your new account.';
        loginError.className = 'form-message success';
        loginError.style.display = 'block';
      } else {
        // Show error message
        errorElement.textContent = data.message || 'Registration failed. Please try again.';
        errorElement.style.display = 'block';
      }
    })
    .catch(error => {
      console.error('Registration error:', error);
      errorElement.textContent = 'An error occurred. Please try again later.';
      errorElement.style.display = 'block';
    });
  }
  
  /**
   * Verify if the current token is valid
   */
  function verifyToken(token) {
    return fetch(`${config.apiUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Update user data if needed
        user = data.user;
        localStorage.setItem(config.userInfoName, JSON.stringify(user));
        
        return user;
      } else {
        return null;
      }
    })
    .catch(error => {
      console.error('Token verification error:', error);
      return null;
    });
  }
  
  /**
   * Logout the current user
   */
  function logout() {
    token = null;
    user = null;
    
    localStorage.removeItem(config.tokenName);
    localStorage.removeItem(config.userInfoName);
    
    updateUI(false);
    
    // Redirect to home if on dashboard
    if (window.location.pathname.includes('dashboard')) {
      window.location.href = 'index.html';
    }
  }
  
  /**
   * Update UI based on auth state
   */
  function updateUI(isLoggedIn) {
    // Login Button
    const signInBtn = document.getElementById('signInBtn');
    const mobileSignIn = document.getElementById('mobileSignIn');
    
    // User profile elements
    const userProfileElement = document.querySelector('.user-profile');
    const userNameElement = document.querySelector('.user-name');
    const userAvatarImg = document.querySelector('.user-avatar img');
    
    if (isLoggedIn && user) {
      // Update username
      if (userNameElement) {
        userNameElement.textContent = user.name || user.email;
      }
      
      // Show user profile
      if (userProfileElement) {
        userProfileElement.style.display = 'flex';
      }
      
      // Hide login buttons
      if (signInBtn) {
        signInBtn.style.display = 'none';
      }
      
      if (mobileSignIn) {
        mobileSignIn.style.display = 'none';
      }
    } else {
      // Hide user profile
      if (userProfileElement) {
        userProfileElement.style.display = 'none';
      }
      
      // Show login buttons
      if (signInBtn) {
        signInBtn.style.display = 'block';
      }
      
      if (mobileSignIn) {
        mobileSignIn.style.display = 'block';
      }
    }
  }
  
  /**
   * Check if user is authenticated
   */
  function isAuthenticated() {
    return !!token;
  }
  
  // Public API
  return {
    init: init,
    logout: logout,
    verifyToken: verifyToken
  };
})();

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  AuthModule.init();
}); 