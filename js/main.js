// Import all modules
import { i18n } from './modules/i18n.js';
import { ui } from './modules/ui.js';

// Main application object
const AutoSubmitSite = {
  init: function() {
    this.initMobileMenu();
    this.initFormSubmission();
    this.initLanguageSwitcher();
    this.initScrollBehavior();
    this.initCopyButtons();
  },
  
  // Mobile Menu Toggle
  initMobileMenu: function() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (menuToggle && navLinks) {
      menuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', function(event) {
        if (!event.target.closest('#navLinks') && !event.target.closest('#menuToggle')) {
          if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
          }
        }
      });
    }
  },
  
  // Form Submission Handling
  initFormSubmission: function() {
    const demoForm = document.getElementById('demoForm');
    
    if (demoForm) {
      demoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const domain = document.getElementById('domain').value;
        const method = document.getElementById('submissionMethod').value;
        const sitemap = document.getElementById('sitemapUrl').value;
        const urlLimit = document.getElementById('urlLimit').value || '100';
        const submitSitemap = document.getElementById('submitSitemap')?.checked;
        const enterpriseMode = document.getElementById('enterpriseMode')?.checked;
        
        // Show results area
        const resultArea = document.getElementById('resultArea');
        const resultContent = document.getElementById('resultContent');
        
        if (resultArea && resultContent) {
          resultArea.style.display = 'block';
          resultContent.innerHTML = '<div class="loading">Processing submission...</div>';
          
          // Simulate API call with timeout
          setTimeout(function() {
            let results = '';
            
            results += `<div class="result-item"><strong>Domain:</strong> ${domain}</div>`;
            results += `<div class="result-item"><strong>Method:</strong> ${method}</div>`;
            
            if (sitemap) {
              results += `<div class="result-item"><strong>Sitemap:</strong> ${sitemap}</div>`;
            }
            
            results += `<div class="result-item"><strong>URL Limit:</strong> ${urlLimit}</div>`;
            
            if (submitSitemap) {
              results += '<div class="result-item">Submitting sitemap to Google Search Console...</div>';
            }
            
            results += '<div class="result-item">Initializing submission process...</div>';
            
            if (method === 'site' || method === 'both') {
              results += '<div class="result-item">Using "site:" operator method...</div>';
            }
            
            if (method === 'api' || method === 'both') {
              results += '<div class="result-item">Using Google Search Console API...</div>';
            }
            
            if (enterpriseMode) {
              results += '<div class="result-item">Enterprise mode detected. Optimizing for multiple domains...</div>';
              results += '<div class="result-item">Distributing workload across multiple workflows...</div>';
              results += '<div class="result-item">Successfully submitted 5 URLs from first batch (demo limited to 5)</div>';
            } else {
              results += '<div class="result-item">Successfully submitted 5 URLs (demo limited to 5)</div>';
            }
            
            results += '<div class="result-item"><strong>SEO Impact:</strong> Expect faster indexing within 1-7 days compared to weeks of waiting</div>';
            results += '<div class="result-item"><strong>Submission complete!</strong> In a real scenario, all URLs would be processed automatically on your schedule.</div>';
            
            resultContent.innerHTML = results;
          }, 2000);
        }
      });
    }
  },
  
  // Language Switcher
  initLanguageSwitcher: function() {
    const languageSelector = document.getElementById('languageSelector');
    
    if (languageSelector) {
      languageSelector.addEventListener('change', function(e) {
        const language = e.target.value;
        console.log('Language changed to: ' + language);
        
        // If using i18n module
        if (window.i18n && typeof window.i18n.setLanguage === 'function') {
          window.i18n.setLanguage(language);
        }
      });
      
      // Set initial language based on browser preference
      const browserLang = navigator.language.split('-')[0];
      const supportedLanguages = ['en', 'zh', 'es', 'fr'];
      
      if (supportedLanguages.includes(browserLang)) {
        languageSelector.value = browserLang;
        this.loadLanguage(browserLang);
      }
    }
  },
  
  // Placeholder for language loading function
  loadLanguage: function(lang) {
    // In a real implementation, this would load language files and update the UI
    fetch(`js/locales/${lang}.json`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load language: ${lang}`);
        }
        return response.json();
      })
      .then(translations => {
        this.updateUIWithTranslations(translations);
      })
      .catch(error => {
        console.error('Error loading language:', error);
      });
  },
  
  // Placeholder for UI translation function
  updateUIWithTranslations: function(translations) {
    // This would update all text in the UI based on the translations
    console.log('Translations loaded, would update UI:', translations);
  },
  
  // Smooth scroll behavior for anchor links
  initScrollBehavior: function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
          e.preventDefault();
          
          const targetElement = document.querySelector(href);
          if (targetElement) {
            window.scrollTo({
              top: targetElement.offsetTop - 80,
              behavior: 'smooth'
            });
          }
        }
      });
    });
  },
  
  // Copy buttons for code snippets
  initCopyButtons: function() {
    document.querySelectorAll('.copy-btn').forEach(button => {
      button.addEventListener('click', function() {
        const codeBlock = this.previousElementSibling;
        const textToCopy = codeBlock.textContent;
        
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            // Change button text temporarily
            const originalText = this.textContent;
            this.textContent = 'Copied!';
            
            setTimeout(() => {
              this.textContent = originalText;
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy text: ', err);
          });
      });
    });
  }
};

// Make AutoSubmitSite available globally
window.AutoSubmitSite = AutoSubmitSite;

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the application
  AutoSubmitSite.init();
}); 