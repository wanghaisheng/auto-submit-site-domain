// Internationalization module
export const i18n = {
  currentLanguage: 'en',
  
  // Initialize the internationalization
  init: function() {
    // Set the initial language based on browser or localStorage
    const savedLanguage = localStorage.getItem('language') || navigator.language.split('-')[0] || 'en';
    this.setLanguage(savedLanguage);
    
    // Initialize language selector
    const languageSelector = document.getElementById('languageSelector');
    if (languageSelector) {
      languageSelector.value = this.currentLanguage;
      languageSelector.addEventListener('change', (e) => {
        this.setLanguage(e.target.value);
      });
    }
  },
  
  // Load language file and update the UI
  setLanguage: async function(lang) {
    try {
      const response = await fetch(`js/locales/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Language ${lang} not found`);
      }
      
      const translations = await response.json();
      this.currentLanguage = lang;
      localStorage.setItem('language', lang);
      
      // Update all elements with data-i18n attribute
      this.updateContent(translations);
      
      // Update language selector
      const languageSelector = document.getElementById('languageSelector');
      if (languageSelector) {
        languageSelector.value = lang;
      }
    } catch (error) {
      console.error('Error loading language:', error);
      // Fallback to English
      if (lang !== 'en') {
        this.setLanguage('en');
      }
    }
  },
  
  // Update all elements with data-i18n attribute
  updateContent: function(translations) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.getNestedTranslation(translations, key);
      
      if (translation) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          if (element.getAttribute('placeholder')) {
            element.setAttribute('placeholder', translation);
          } else {
            element.value = translation;
          }
        } else {
          element.innerHTML = translation;
        }
      }
    });
  },
  
  // Get nested translation by dot notation key
  getNestedTranslation: function(obj, path) {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result && Object.prototype.hasOwnProperty.call(result, key)) {
        result = result[key];
      } else {
        return null;
      }
    }
    
    return result;
  },
  
  // Debug helper function
  debugI18n: function() {
    const elements = document.querySelectorAll('[data-i18n]');
    console.log(`Total elements with data-i18n: ${elements.length}`);
    
    const keys = {};
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      keys[key] = (keys[key] || 0) + 1;
    });
    
    console.log('i18n keys used in the document:', keys);
    
    // Check which keys are missing from current language
    const currentLang = document.documentElement.lang || 'en';
    fetch(`js/locales/${currentLang}.json`)
      .then(response => response.json())
      .then(translations => {
        const missingKeys = [];
        Object.keys(keys).forEach(key => {
          const value = this.getNestedTranslation(translations, key);
          if (!value) {
            missingKeys.push(key);
          }
        });
        
        if (missingKeys.length > 0) {
          console.warn(`Missing keys in ${currentLang}.json:`, missingKeys);
        } else {
          console.log(`All keys are present in ${currentLang}.json`);
        }
      });
  }
}; 