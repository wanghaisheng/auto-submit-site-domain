/**
 * Animations and Visual Effects
 * This script adds various animations and visual effects to enhance the user experience
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize fade-in animations for sections
  initFadeInSections();
  
  // Add hover effects to feature cards
  enhanceFeatureCards();
  
  // Add parallax effect to hero section
  initParallaxEffect();
  
  // Add scroll animations
  initScrollAnimations();

  // Animate elements when they come into view
  const animateOnScroll = function() {
    const elementsToAnimate = document.querySelectorAll('.feature-card, .pricing-plan, .testimonial-item, .pain-point-card');
    
    elementsToAnimate.forEach(element => {
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight;
      
      if (elementPosition < screenPosition - 100) {
        element.classList.add('animated');
      }
    });
  };
  
  // Run on initial load
  animateOnScroll();
  
  // Run on scroll
  window.addEventListener('scroll', animateOnScroll);

  // Trust comparison SVG animation
  const trustSvgElement = document.querySelector('.trust-comparison-illustration');
  if (trustSvgElement) {
    trustSvgElement.addEventListener('mouseover', function() {
      // After SVG is loaded, we can access its internal elements
      trustSvgElement.addEventListener('load', function() {
        try {
          // Get the SVG document
          const svgDoc = trustSvgElement.contentDocument;
          if (!svgDoc) return;
          
          // Add hover effects to the platforms
          const ourSolution = svgDoc.getElementById('our-solution');
          const manualSubmission = svgDoc.getElementById('manual-submission');
          const enterpriseTools = svgDoc.getElementById('enterprise-tools');
          const ribbon = svgDoc.getElementById('ribbon');
          
          if (ourSolution) {
            ourSolution.style.transition = 'transform 0.3s ease';
            ourSolution.addEventListener('mouseover', function() {
              ourSolution.style.transform = 'translate(225px, 75px) scale(1.05)';
              // Make the ribbon bounce
              if (ribbon) {
                ribbon.style.animation = 'bounce 0.5s ease infinite alternate';
                setTimeout(() => {
                  ribbon.style.animation = '';
                }, 1500);
              }
            });
            ourSolution.addEventListener('mouseout', function() {
              ourSolution.style.transform = 'translate(225px, 80px)';
            });
          }
          
          if (manualSubmission) {
            manualSubmission.style.transition = 'transform 0.3s ease';
            manualSubmission.addEventListener('mouseover', function() {
              manualSubmission.style.transform = 'translate(50px, 95px) scale(1.05)';
            });
            manualSubmission.addEventListener('mouseout', function() {
              manualSubmission.style.transform = 'translate(50px, 100px)';
            });
          }
          
          if (enterpriseTools) {
            enterpriseTools.style.transition = 'transform 0.3s ease';
            enterpriseTools.addEventListener('mouseover', function() {
              enterpriseTools.style.transform = 'translate(430px, 95px) scale(1.05)';
            });
            enterpriseTools.addEventListener('mouseout', function() {
              enterpriseTools.style.transform = 'translate(430px, 100px)';
            });
          }
          
          // Add animation for prices
          const prices = svgDoc.getElementById('pricing');
          if (prices) {
            prices.querySelectorAll('text').forEach(priceText => {
              priceText.style.transition = 'transform 0.3s ease, fill 0.3s ease';
              priceText.addEventListener('mouseover', function() {
                this.style.transform = 'scale(1.2)';
                this.style.fill = '#4158D0';
              });
              priceText.addEventListener('mouseout', function() {
                this.style.transform = '';
                this.style.fill = '';
              });
            });
          }
          
          // Add bounce animation to the Keyframes style
          const style = document.createElement('style');
          style.textContent = `
            @keyframes bounce {
              0% { transform: translateY(0); }
              100% { transform: translateY(-5px); }
            }
          `;
          document.head.appendChild(style);
          
        } catch (e) {
          console.log('SVG animation initialization error:', e);
        }
      });
    }, { once: true });
  }
});

/**
 * Initialize fade-in animations for sections when they come into view
 */
function initFadeInSections() {
  // Add the fade-in-section class to all major sections
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    if (!section.classList.contains('hero')) { // Skip hero section as it's already visible
      section.classList.add('fade-in-section');
    }
  });
  
  // Add reveal animations to specific elements
  const revealLeftElements = document.querySelectorAll('.waitlist-text, .comparison .section-header');
  revealLeftElements.forEach(el => el.classList.add('reveal-left'));
  
  const revealRightElements = document.querySelectorAll('.waitlist-image, .hero-image');
  revealRightElements.forEach(el => el.classList.add('reveal-right'));
  
  const revealUpElements = document.querySelectorAll('.features .section-header, .how-it-works .section-header');
  revealUpElements.forEach(el => el.classList.add('reveal-up'));
  
  // Check which sections and elements are visible on scroll
  checkVisibility();
  window.addEventListener('scroll', checkVisibility);
  
  function checkVisibility() {
    // Check sections
    const fadeSections = document.querySelectorAll('section');
    fadeSections.forEach(section => {
      // Check if section is in viewport
      const rect = section.getBoundingClientRect();
      const isVisible = (
        rect.top <= (window.innerHeight * 0.8) && 
        rect.bottom >= (window.innerHeight * 0.2)
      );
      
      if (isVisible) {
        section.classList.add('is-visible');
      }
    });
    
    // Check reveal elements
    const revealElements = document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up');
    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top <= (window.innerHeight * 0.8);
      
      if (isVisible) {
        el.classList.add('is-visible');
      }
    });
  }
}

/**
 * Add enhanced hover effects to feature cards and other elements
 */
function enhanceFeatureCards() {
  // Enhanced feature cards
  const cards = document.querySelectorAll('.feature-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.classList.add('enhanced-card-hover');
      
      // Find the icon within this card and add bounce animation
      const icon = this.querySelector('.feature-icon i');
      if (icon) {
        icon.style.animation = 'bounce 1s ease';
        setTimeout(() => {
          icon.style.animation = '';
        }, 1000);
      }
    });
    
    card.addEventListener('mouseleave', function() {
      this.classList.remove('enhanced-card-hover');
    });
  });
  
  // Add animated icon effect
  const icons = document.querySelectorAll('.feature-icon i, .benefit-item i');
  icons.forEach(icon => {
    icon.classList.add('animated-icon');
  });
  
  // Animate the features grid when it comes into view
  const featuresGrids = document.querySelectorAll('.features-grid');
  featuresGrids.forEach(grid => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          grid.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    
    observer.observe(grid);
  });
  
  // Add hover effects to buttons
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-3px)';
      this.style.boxShadow = '0 7px 14px rgba(0, 0, 0, 0.1)';
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.transform = '';
      this.style.boxShadow = '';
    });
  });
}

/**
 * Add parallax effect to hero section
 */
function initParallaxEffect() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  
  window.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    if (scrollPosition < 600) { // Only apply effect near the top of the page
      const heroImage = document.querySelector('.hero-image');
      if (heroImage) {
        heroImage.style.transform = `translateY(${scrollPosition * 0.1}px)`;
      }
      
      const heroContent = document.querySelector('.hero-content');
      if (heroContent) {
        heroContent.style.transform = `translateY(${scrollPosition * 0.05}px)`;
      }
    }
  });
}

/**
 * Initialize scroll animations for various elements
 */
function initScrollAnimations() {
  // Animate comparison table rows on scroll
  const comparisonTable = document.querySelector('.comparison-table');
  if (comparisonTable) {
    const tableRows = comparisonTable.querySelectorAll('tbody tr');
    
    const animateRows = () => {
      tableRows.forEach((row, index) => {
        const rect = row.getBoundingClientRect();
        const isVisible = rect.top <= (window.innerHeight * 0.8);
        
        if (isVisible) {
          // Add staggered animation delay based on row index
          setTimeout(() => {
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';
          }, index * 100);
        }
      });
    };
    
    // Set initial styles
    tableRows.forEach(row => {
      row.style.opacity = '0';
      row.style.transform = 'translateX(-20px)';
      row.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    window.addEventListener('scroll', animateRows);
    // Initial check
    animateRows();
  }
  
  // Add counter animation to numbers
  const animateCounters = () => {
    const counters = document.querySelectorAll('.counter-value');
    counters.forEach(counter => {
      const rect = counter.getBoundingClientRect();
      const isVisible = rect.top <= (window.innerHeight * 0.8);
      
      if (isVisible && !counter.classList.contains('animated')) {
        counter.classList.add('animated');
        const target = parseInt(counter.getAttribute('data-target'));
        let count = 0;
        const duration = 2000; // ms
        const increment = target / (duration / 16); // 60fps
        
        const updateCount = () => {
          count += increment;
          if (count < target) {
            counter.textContent = Math.ceil(count).toLocaleString();
            requestAnimationFrame(updateCount);
          } else {
            counter.textContent = target.toLocaleString();
          }
        };
        
        updateCount();
      }
    });
  };
  
  window.addEventListener('scroll', animateCounters);
  // Initial check
  animateCounters();
  
  // Animate section headers with a subtle fade-in and slide-up effect
  const sectionHeaders = document.querySelectorAll('.section-header');
  sectionHeaders.forEach(header => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          header.style.opacity = '1';
          header.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
          
          // Animate the heading and paragraph separately with a slight delay
          const heading = header.querySelector('h2');
          const paragraph = header.querySelector('p');
          
          if (heading) {
            heading.style.opacity = '1';
            heading.style.transform = 'translateY(0)';
          }
          
          if (paragraph) {
            setTimeout(() => {
              paragraph.style.opacity = '1';
              paragraph.style.transform = 'translateY(0)';
            }, 200);
          }
        }
      });
    }, { threshold: 0.2 });
    
    // Set initial styles
    header.style.opacity = '0';
    header.style.transform = 'translateY(20px)';
    header.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    
    const heading = header.querySelector('h2');
    const paragraph = header.querySelector('p');
    
    if (heading) {
      heading.style.opacity = '0';
      heading.style.transform = 'translateY(20px)';
      heading.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    }
    
    if (paragraph) {
      paragraph.style.opacity = '0';
      paragraph.style.transform = 'translateY(20px)';
      paragraph.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    }
    
    observer.observe(header);
  });
}