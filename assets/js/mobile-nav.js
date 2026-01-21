// Mobile Menu Toggle Logic
document.addEventListener('DOMContentLoaded', function() {
    // Determine which elements to use
    // We need to inject a toggle button if it doesn't exist, OR use the .cat-menu as toggle on desktop and something else on mobile.
    // The CSS assumes a .mobile-menu-toggle element exists.
    
    const navContainer = document.querySelector('.main-nav .container');
    const navLinks = document.querySelector('.nav-links');
    
    // Create toggle icon
    const toggleBtn = document.createElement('div');
    toggleBtn.className = 'mobile-menu-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i> Menu';
    
    // Insert before nav-links in the flex container
    if(navContainer && navLinks) {
        navContainer.insertBefore(toggleBtn, navLinks);
        
        toggleBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Also close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!navContainer.contains(event.target)) {
            navLinks.classList.remove('active');
        }
    });
});
