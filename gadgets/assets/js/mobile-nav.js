// Mobile Menu Toggle Logic
document.addEventListener('DOMContentLoaded', function() {
    const navContainer = document.querySelector('.main-nav .container');
    const navLinks = document.querySelector('.nav-links');
    
    // Create toggle icon (Hamburger)
    const toggleBtn = document.createElement('div');
    toggleBtn.className = 'mobile-menu-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    
    // Create Close Button
    const closeBtn = document.createElement('div');
    closeBtn.className = 'mobile-menu-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';

    // Create Overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    document.body.appendChild(overlay);
    
    // Insert toggle button before nav-links in the flex container
    if(navContainer && navLinks) {
        navContainer.insertBefore(toggleBtn, navLinks);
        
        // Insert close button inside nav-links
        navLinks.prepend(closeBtn);
        
        // Open Menu
        toggleBtn.addEventListener('click', function() {
            navLinks.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });

        // Close Menu Function
        function closeMenu() {
            navLinks.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Event Listeners for Closing
        closeBtn.addEventListener('click', closeMenu);
        overlay.addEventListener('click', closeMenu);
        
        // Close when clicking a link (optional, good for single page apps, but harmless here)
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

    // Also close menu when clicking outside
    document.addEventListener('click', function(event) {
        // Handled by overlay now
    });
});
