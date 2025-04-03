// Consolidated JavaScript with a module pattern
const RankDaily = {
  init: function() {
    this.setupEventListeners();
    this.initLanguageSelector();
    this.initPricingToggle();
    this.initFaqAccordion();
    
    // Initialize with default language
    const savedLanguage = localStorage.getItem('preferredLanguage');
    const browserLanguage = navigator.language.split('-')[0];
    const defaultLanguage = savedLanguage || browserLanguage || 'en';
    
    // Set default language in the UI
    document.documentElement.lang = defaultLanguage;
    if (document.getElementById('languageSelector')) {
      document.getElementById('languageSelector').value = defaultLanguage;
    }
    
    // Apply translations and execute the debug function to check for missing keys
    this.changeLanguage(defaultLanguage);
    this.debugI18n(); // This will log any missing i18n keys in the console
  },
  
  setupEventListeners: function() {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
      menuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active');
      });
    }
  },
  
  initLanguageSelector: function() {
    const languageSelector = document.getElementById('languageSelector');
    if (languageSelector) {
      // Set initial language based on localStorage or browser preference
      const savedLanguage = localStorage.getItem('preferredLanguage');
      const browserLanguage = navigator.language.split('-')[0];
      const defaultLanguage = savedLanguage || browserLanguage || 'en';
      
      if (languageSelector.querySelector(`option[value="${defaultLanguage}"]`)) {
        languageSelector.value = defaultLanguage;
      }
      
      // Handle language change
      languageSelector.addEventListener('change', function(e) {
        const selectedLanguage = e.target.value;
        localStorage.setItem('preferredLanguage', selectedLanguage);
        
        // Load language file and update UI
        RankDaily.changeLanguage(selectedLanguage);
      });
    }
  },
  
  changeLanguage: function(lang) {
    console.log('Language changed to: ' + lang);
    document.documentElement.lang = lang; // Set the HTML lang attribute
    
    // Load language file
    fetch(`js/locales/${lang}.json`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load ${lang} translations`);
        }
        return response.json();
      })
      .then(translations => {
        // Update all elements with data-i18n attributes
        const elements = document.querySelectorAll('[data-i18n]');
        console.log(`Found ${elements.length} elements with data-i18n attributes`);
        
        elements.forEach(el => {
          const key = el.getAttribute('data-i18n');
          const translated = this.getNestedTranslation(translations, key);
          
          if (translated) {
            if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
              el.placeholder = translated;
            } else {
              el.innerHTML = translated;
            }
          } else {
            console.warn(`Missing translation for key: ${key} in language: ${lang}`);
          }
        });
        
        // Handle placeholder translations
        const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
        placeholders.forEach(el => {
          const key = el.getAttribute('data-i18n-placeholder');
          const translated = this.getNestedTranslation(translations, key);
          
          if (translated) {
            el.placeholder = translated;
          }
        });
      })
      .catch(error => {
        console.error('Error loading translations:', error);
      });
  },
  
  getNestedTranslation: function(obj, path) {
    const keys = path.split('.');
    return keys.reduce((acc, key) => {
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
  },
  
  debugI18n: function() {
    // Find all elements with data-i18n attributes and check if they have translations
    const elements = document.querySelectorAll('[data-i18n]');
    const missingKeys = [];
    
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key || key.trim() === '') {
        missingKeys.push({
          element: el,
          issue: 'Empty data-i18n attribute'
        });
      }
    });
    
    if (missingKeys.length > 0) {
      console.warn('Found elements with i18n issues:', missingKeys);
    }
  },

  initPricingToggle: function() {
    // Pricing toggle functionality
    const pricingToggleContainer = document.querySelector('.pricing-toggle-container');
    const pricingToggleSwitch = document.querySelector('.pricing-toggle-switch');
    const pricingLabels = document.querySelectorAll('.pricing-toggle-label');
    
    if (pricingToggleSwitch) {
      pricingToggleSwitch.addEventListener('click', function() {
        // Toggle yearly class
        pricingToggleContainer.classList.toggle('yearly');
        
        // Update active label
        pricingLabels.forEach(label => {
          label.classList.toggle('active');
        });
        
        // Update prices
        const isYearly = pricingToggleContainer.classList.contains('yearly');
        const planPrices = document.querySelectorAll('.plan-price');
        
        planPrices.forEach(price => {
          const currentPrice = price.textContent;
          if (currentPrice.includes('/month')) {
            // Switch to yearly
            if (isYearly) {
              const monthlyPrice = parseFloat(currentPrice.replace(/[^0-9.]/g, ''));
              const yearlyPrice = Math.round(monthlyPrice * 12 * 0.8); // 20% discount
              price.innerHTML = `$${yearlyPrice}<span>/year</span>`;
            }
          } else if (currentPrice.includes('/year')) {
            // Switch to monthly
            if (!isYearly) {
              const yearlyPrice = parseFloat(currentPrice.replace(/[^0-9.]/g, ''));
              const monthlyPrice = Math.round((yearlyPrice / 12) / 0.8 * 10) / 10; // Reverse 20% discount
              price.innerHTML = `$${monthlyPrice}<span>/month</span>`;
            }
          }
          // Skip one-time prices that don't have /month or /year
        });
      });
    }
  },

  initFaqAccordion: function() {
    // FAQ accordion functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    if (faqQuestions.length > 0) {
      faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
          const faqItem = question.parentElement;
          faqItem.classList.toggle('active');
        });
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the RankDaily module
  RankDaily.init();
  
  // Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      document.getElementById('navLinks').classList.toggle('active');
    });
  }

  // Language switcher functionality
  const languageSelector = document.getElementById('languageSelector');
  if (languageSelector) {
    languageSelector.addEventListener('change', function() {
      const selectedLanguage = this.value;
      // Here you would implement the language switching logic
      console.log('Language changed to:', selectedLanguage);
    });
  }

  // Pricing toggle functionality
  const pricingToggle = document.querySelector('.pricing-toggle input');
  if (pricingToggle) {
    pricingToggle.addEventListener('change', function() {
      const isYearly = this.checked;
      const monthlyPrices = document.querySelectorAll('.amount.monthly');
      const yearlyPrices = document.querySelectorAll('.amount.yearly');
      
      monthlyPrices.forEach(price => {
        price.style.display = isYearly ? 'none' : 'block';
      });
      
      yearlyPrices.forEach(price => {
        price.style.display = isYearly ? 'block' : 'none';
      });
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Form submission handling
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      // Here you would handle form submission, possibly with AJAX
      console.log('Form submitted');
      
      // Show success message if it exists
      const successMessage = form.querySelector('.success-message');
      if (successMessage) {
        successMessage.style.display = 'block';
        // Reset form
        form.reset();
      }
    });
  });

  // Demo Form Submission
  const demoForm = document.getElementById('demoForm');
  if (demoForm) {
    demoForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const domain = document.getElementById('domain').value;
      const method = document.getElementById('submissionMethod').value;
      const sitemap = document.getElementById('sitemapUrl').value;
      const urlLimit = document.getElementById('urlLimit').value || '100';
      const submitSitemap = document.getElementById('submitSitemap').checked;
      const enterpriseMode = document.getElementById('enterpriseMode').checked;
      
      // Show results area
      const resultArea = document.getElementById('resultArea');
      const resultContent = document.getElementById('resultContent');
      resultArea.style.display = 'block';
      
      // Simulate processing
      resultContent.innerHTML = '<div class="result-item">Processing submission for ' + domain + '...</div>';
      
      // Simulate API call delay
      setTimeout(function() {
        let results = '';
        
        if (method === 'site') {
          results += '<div class="result-item"><strong>Using site: operator method</strong> - Perfect for small businesses without Search Console access</div>';
          results += '<div class="result-item">Opening Google Search with query: site:' + domain + '</div>';
          results += '<div class="result-item">Simulating browser automation to avoid detection...</div>';
        } else if (method === 'gsc') {
          results += '<div class="result-item"><strong>Using Google Search Console API</strong> - Recommended for verified site owners</div>';
          results += '<div class="result-item">Authenticating with Google API...</div>';
          results += '<div class="result-item">Preparing direct indexing requests...</div>';
        } else if (method === 'gsc_direct') {
          results += '<div class="result-item"><strong>Using GSC Direct Submission</strong> - Advanced feature for verified site owners</div>';
          results += '<div class="result-item">Authenticating with Google Search Console...</div>';
          results += '<div class="result-item">Checking for non-indexed URLs...</div>';
          results += '<div class="result-item">Preparing direct submission requests...</div>';
        }
        
        if (sitemap) {
          results += '<div class="result-item">Parsing sitemap: ' + sitemap + '</div>';
          results += '<div class="result-item">Found 25 URLs in sitemap</div>';
          
          if (submitSitemap) {
            results += '<div class="result-item"><strong>Submitting sitemap directly to Google Search Console</strong></div>';
          }
          
          results += '<div class="result-item">Applying smart rate limiting to avoid CAPTCHA challenges...</div>';
        } else {
          results += '<div class="result-item">No sitemap provided, extracting links from homepage</div>';
          results += '<div class="result-item">Found 12 URLs on homepage</div>';
          results += '<div class="result-item">Prioritizing important pages based on link structure...</div>';
        }
        
        results += '<div class="result-item">URL limit per domain set to: ' + urlLimit + '</div>';
        
        if (enterpriseMode) {
          results += '<div class="result-item"><strong>Enterprise Mode activated</strong> - Handling large volume of URLs</div>';
          results += '<div class="result-item">Splitting URLs into batches of 10,000 for efficient processing</div>';
          results += '<div class="result-item">Distributing workload across multiple workflows...</div>';
          results += '<div class="result-item">Successfully submitted 5 URLs from first batch (demo limited to 5)</div>';
        } else {
          results += '<div class="result-item">Successfully submitted 5 URLs (demo limited to 5)</div>';
        }
        
        results += '<div class="result-item"><strong>SEO Impact:</strong> Expect faster indexing within 1-7 days compared to weeks of waiting</div>';
        results += '<div class="result-item"><strong>Submission complete!</strong> In a real scenario, all URLs would be processed automatically on your schedule.</div>';
        
        resultContent.innerHTML = results;
      }, 2000);
    });
  }

  // FAQ accordion functionality
  const faqQuestions = document.querySelectorAll('.faq-question');
  if (faqQuestions.length > 0) {
    faqQuestions.forEach(question => {
      question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        faqItem.classList.toggle('active');
      });
    });
  }

  // Lazy loading functionality
  function loadScript(src, async = true, defer = true) {
    const script = document.createElement('script');
    script.src = src;
    if (async) script.async = true;
    if (defer) script.defer = true;
    document.body.appendChild(script);
  }
  
  // Lazy load images when they come into view
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    if (lazyImages.length > 0) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });
      
      lazyImages.forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
});