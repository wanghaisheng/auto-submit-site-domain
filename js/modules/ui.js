// UI module for handling DOM interactions
export const ui = {
  init: function() {
    this.initPricingToggle();
    this.initFaqAccordion();
    this.initMobileMenu();
    this.initScrollBehavior();
    this.initNewsletterForm();
    this.initTabSwitchers();
    this.initFormValidation();
  },
  
  // Toggle pricing between monthly and yearly
  initPricingToggle: function() {
    const pricingToggle = document.getElementById('pricingToggle');
    if (pricingToggle) {
      pricingToggle.addEventListener('change', function() {
        const pricingCards = document.querySelectorAll('.pricing-card');
        pricingCards.forEach(card => {
          card.classList.toggle('yearly', this.checked);
        });
      });
    }
  },
  
  // Initialize FAQ accordion
  initFaqAccordion: function() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
      question.addEventListener('click', function() {
        // Toggle active state for clicked question
        this.classList.toggle('active');
        
        // Toggle answer visibility
        const answer = this.nextElementSibling;
        answer.classList.toggle('active');
        
        // Update ARIA attributes for accessibility
        const expanded = this.classList.contains('active');
        this.setAttribute('aria-expanded', expanded);
        answer.setAttribute('aria-hidden', !expanded);
        
        // Adjust answer height for smooth animation
        if (expanded) {
          answer.style.height = answer.scrollHeight + 'px';
        } else {
          answer.style.height = '0';
        }
      });
    });
  },
  
  // Initialize mobile menu
  initMobileMenu: function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', function() {
        const nav = document.querySelector('nav');
        nav.classList.toggle('mobile-open');
        
        // Toggle icon between bars and times
        const icon = this.querySelector('i');
        if (icon.classList.contains('fa-bars')) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times');
        } else {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      });
      
      // Close mobile menu when clicking outside
      document.addEventListener('click', function(event) {
        const nav = document.querySelector('nav');
        const isClickInsideNav = nav.contains(event.target);
        const isClickOnToggle = mobileMenuToggle.contains(event.target);
        
        if (nav.classList.contains('mobile-open') && !isClickInsideNav && !isClickOnToggle) {
          nav.classList.remove('mobile-open');
          
          // Reset icon
          const icon = mobileMenuToggle.querySelector('i');
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      });
      
      // Add click event to mobile nav links to close menu
      const mobileNavLinks = document.querySelectorAll('.nav-links a');
      mobileNavLinks.forEach(link => {
        link.addEventListener('click', function() {
          const nav = document.querySelector('nav');
          if (nav.classList.contains('mobile-open')) {
            nav.classList.remove('mobile-open');
            
            // Reset icon
            const icon = mobileMenuToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
          }
        });
      });
    }
  },
  
  // Smooth scroll behavior
  initScrollBehavior: function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId !== '#') {
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            e.preventDefault();
            window.scrollTo({
              top: targetElement.offsetTop - 80, // Account for header height
              behavior: 'smooth'
            });
          }
        }
      });
    });
  },
  
  // Newsletter form submission
  initNewsletterForm: function() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const emailInput = this.querySelector('input[type="email"]');
        const email = emailInput.value.trim();
        
        if (this.checkEmailValidity(email)) {
          // Show success message
          this.showMessage('Thank you for subscribing!', 'success');
          emailInput.value = '';
        } else {
          // Show error message
          this.showMessage('Please enter a valid email address', 'error');
        }
      }.bind(this));
    }
  },
  
  // Tab switching functionality
  initTabSwitchers: function() {
    const tabButtons = document.querySelectorAll('[data-tab-target]');
    const tabContents = document.querySelectorAll('[data-tab-content]');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        const target = this.dataset.tabTarget;
        
        // Deactivate all tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Activate clicked tab
        this.classList.add('active');
        document.querySelector(target).classList.add('active');
      });
    });
  },
  
  // Form validation
  initFormValidation: function() {
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
      form.addEventListener('submit', function(e) {
        let isValid = true;
        
        // Check all required fields
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
          if (!field.value.trim()) {
            isValid = false;
            this.showError(field, 'This field is required');
          } else {
            this.clearError(field);
          }
        });
        
        // Email validation
        const emailFields = form.querySelectorAll('[type="email"]');
        emailFields.forEach(field => {
          if (field.value && !this.isValidEmail(field.value)) {
            isValid = false;
            this.showError(field, 'Please enter a valid email address');
          }
        });
        
        if (!isValid) {
          e.preventDefault();
        }
      }.bind(this));
    });
  },
  
  // Helper methods
  checkEmailValidity: function(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  },
  
  showMessage: function(message, type) {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `form-message ${type}`;
    messageEl.textContent = message;
    
    // Find form and append message
    const form = document.querySelector('.newsletter-form');
    form.appendChild(messageEl);
    
    // Remove message after 3 seconds
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  },
  
  showError: function(field, message) {
    // Remove any existing error
    this.clearError(field);
    
    // Add error class to field
    field.classList.add('error');
    
    // Create and append error message
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    field.parentNode.appendChild(errorElement);
  },
  
  clearError: function(field) {
    field.classList.remove('error');
    const errorElement = field.parentNode.querySelector('.error-message');
    if (errorElement) {
      errorElement.remove();
    }
  },
  
  isValidEmail: function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
}; 