// Tab switching functionality for the playground section
document.addEventListener('DOMContentLoaded', function() {
    // Get all tab buttons and tab panes
    const tabButtons = document.querySelectorAll('.submission-tabs .tab-btn');
    const tabPanes = document.querySelectorAll('.tab-content .tab-pane');
    
    // Add click event listeners to each tab button
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the tab to activate from the data-tab attribute
            const tabToActivate = this.getAttribute('data-tab');
            
            // Deactivate all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Activate the clicked tab
            this.classList.add('active');
            document.getElementById(tabToActivate).classList.add('active');
        });
    });
});