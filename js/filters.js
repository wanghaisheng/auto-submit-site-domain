// Filters functionality for the playground section
document.addEventListener('DOMContentLoaded', function() {
    // Filter toggle functionality for all tabs
    initFilterToggles();
    
    // Initialize filter reset and apply buttons
    initFilterActions();
});

/**
 * Initialize filter toggle buttons for all tabs
 */
function initFilterToggles() {
    // Domain tab filter toggle
    const domainFilterToggle = document.getElementById('domainFilterToggle');
    const domainFilterSection = document.getElementById('domainFilterSection');
    
    if (domainFilterToggle && domainFilterSection) {
        domainFilterToggle.addEventListener('click', function() {
            toggleFilterSection(domainFilterToggle, domainFilterSection);
        });
    }
    
    // Sitemap tab filter toggle
    const sitemapFilterToggle = document.getElementById('sitemapFilterToggle');
    const sitemapFilterSection = document.getElementById('sitemapFilterSection');
    
    if (sitemapFilterToggle && sitemapFilterSection) {
        sitemapFilterToggle.addEventListener('click', function() {
            toggleFilterSection(sitemapFilterToggle, sitemapFilterSection);
        });
    }
    
    // File tab filter toggle
    const fileFilterToggle = document.getElementById('fileFilterToggle');
    const fileFilterSection = document.getElementById('fileFilterSection');
    
    if (fileFilterToggle && fileFilterSection) {
        fileFilterToggle.addEventListener('click', function() {
            toggleFilterSection(fileFilterToggle, fileFilterSection);
        });
    }
    
    // Cloudflare tab filter toggle
    const cloudflareFilterToggle = document.getElementById('cloudflareFilterToggle');
    const cloudflareFilterSection = document.getElementById('cloudflareFilterSection');
    
    if (cloudflareFilterToggle && cloudflareFilterSection) {
        cloudflareFilterToggle.addEventListener('click', function() {
            toggleFilterSection(cloudflareFilterToggle, cloudflareFilterSection);
        });
    }
}

/**
 * Toggle filter section visibility
 * @param {HTMLElement} toggleButton - The toggle button element
 * @param {HTMLElement} filterSection - The filter section element
 */
function toggleFilterSection(toggleButton, filterSection) {
    // Toggle active class on filter section
    filterSection.classList.toggle('active');
    
    // Toggle active class on button
    toggleButton.classList.toggle('active');
    
    // Update button text
    if (filterSection.classList.contains('active')) {
        toggleButton.innerHTML = '<i class="fas fa-filter"></i> Hide Filters';
    } else {
        toggleButton.innerHTML = '<i class="fas fa-filter"></i> Show Filters';
    }
}

/**
 * Initialize filter reset and apply buttons
 */
function initFilterActions() {
    // Domain tab filter actions
    initTabFilterActions('domain');
    
    // Sitemap tab filter actions
    initTabFilterActions('sitemap');
    
    // File tab filter actions
    initTabFilterActions('file');
    
    // Cloudflare tab filter actions
    initTabFilterActions('cloudflare');
}

/**
 * Initialize filter actions for a specific tab
 * @param {string} tabPrefix - The prefix for the tab's filter elements
 */
function initTabFilterActions(tabPrefix) {
    const resetButton = document.getElementById(`${tabPrefix}ResetFilters`);
    const applyButton = document.getElementById(`${tabPrefix}ApplyFilters`);
    
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            resetFilters(tabPrefix);
        });
    }
    
    if (applyButton) {
        applyButton.addEventListener('click', function() {
            applyFilters(tabPrefix);
        });
    }
}

/**
 * Reset filters for a specific tab
 * @param {string} tabPrefix - The prefix for the tab's filter elements
 */
function resetFilters(tabPrefix) {
    // Reset URL pattern filter
    const urlPatternInput = document.getElementById(`${tabPrefix}UrlPattern`);
    if (urlPatternInput) {
        urlPatternInput.value = '';
    }
    
    // Reset content type checkboxes
    const contentTypeCheckboxes = document.querySelectorAll(`#${tabPrefix}FilterSection .filter-checkbox input[type="checkbox"]`);
    contentTypeCheckboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    
    // Reset date range inputs
    const startDateInput = document.getElementById(`${tabPrefix}StartDate`);
    const endDateInput = document.getElementById(`${tabPrefix}EndDate`);
    
    if (startDateInput) {
        startDateInput.value = '';
    }
    
    if (endDateInput) {
        endDateInput.value = '';
    }
    
    // Reset domain filters if they exist
    const includeDomains = document.getElementById(`${tabPrefix}IncludeDomains`);
    const excludeDomains = document.getElementById(`${tabPrefix}ExcludeDomains`);
    
    if (includeDomains) {
        includeDomains.value = '';
    }
    
    if (excludeDomains) {
        excludeDomains.value = '';
    }
    
    // Reset priority filters
    const priorityNew = document.getElementById(`${tabPrefix}PriorityNew`);
    const priorityPopular = document.getElementById(`${tabPrefix}PriorityPopular`);
    
    if (priorityNew) {
        priorityNew.checked = true;
    }
    
    if (priorityPopular) {
        priorityPopular.checked = false;
    }
    
    console.log(`Filters reset for ${tabPrefix} tab`);
}

/**
 * Apply filters for a specific tab
 * @param {string} tabPrefix - The prefix for the tab's filter elements
 */
function applyFilters(tabPrefix) {
    // In a real implementation, this would filter the URLs based on the selected criteria
    // For this demo, we'll just log the filter values
    
    const urlPattern = document.getElementById(`${tabPrefix}UrlPattern`)?.value || '';
    
    const includePages = document.getElementById(`${tabPrefix}IncludePages`)?.checked || false;
    const includePosts = document.getElementById(`${tabPrefix}IncludePosts`)?.checked || false;
    const includeProducts = document.getElementById(`${tabPrefix}IncludeProducts`)?.checked || false;
    
    const startDate = document.getElementById(`${tabPrefix}StartDate`)?.value || '';
    const endDate = document.getElementById(`${tabPrefix}EndDate`)?.value || '';
    
    const includeDomains = document.getElementById(`${tabPrefix}IncludeDomains`)?.value || '';
    const excludeDomains = document.getElementById(`${tabPrefix}ExcludeDomains`)?.value || '';
    
    const priorityNew = document.getElementById(`${tabPrefix}PriorityNew`)?.checked || false;
    const priorityPopular = document.getElementById(`${tabPrefix}PriorityPopular`)?.checked || false;
    
    console.log(`Applying filters for ${tabPrefix} tab:`, {
        urlPattern,
        includePages,
        includePosts,
        includeProducts,
        dateRange: { startDate, endDate },
        domains: { includeDomains, excludeDomains },
        priority: { new: priorityNew, popular: priorityPopular }
    });
    
    // Show a message to the user
    alert(`Filters applied for ${tabPrefix} tab. Check console for details.`);
}