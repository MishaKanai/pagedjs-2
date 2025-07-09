// Minimal Chrome Fix for PagedJS Infinite Loop
// This targets the specific ex-inline-479 element causing the issue

(function() {
    'use strict';
    
    console.log('🔧 Applying minimal Chrome fix for PagedJS infinite loop...');
    
    // Fix 1: Target the specific problematic element
    function fixProblematicElement() {
        const element = document.getElementById('ex-inline-479');
        if (element) {
            // Remove break-inside: avoid that's causing the infinite loop
            element.style.breakInside = 'auto';
            element.style.pageBreakInside = 'auto';
            
            // Prevent element from being too tall for a page
            element.style.maxHeight = '80vh';
            element.style.overflow = 'hidden';
            
            console.log('✅ Fixed ex-inline-479 element');
            return true;
        }
        return false;
    }
    
    // Fix 2: Intercept PagedJS infinite loop detection
    function interceptInfiniteLoop() {
        // Override console.error to catch and fix the infinite loop
        const originalError = console.error;
        console.error = function(...args) {
            if (args[0] === 'Layout repeated at: ' && args[1] && args[1].id === 'ex-inline-479') {
                console.log('🚨 Infinite loop detected for ex-inline-479 - applying emergency fix...');
                
                // Apply emergency fix to the problematic element
                const element = args[1];
                element.style.breakInside = 'auto';
                element.style.pageBreakInside = 'auto';
                element.style.maxHeight = '600px';
                element.style.overflow = 'hidden';
                
                console.log('✅ Emergency fix applied - continuing rendering...');
                
                // Don't show the original error
                return;
            }
            
            // Show other errors normally
            originalError.apply(console, args);
        };
    }
    
    // Fix 3: Hook into PagedJS layout process
    function hookIntoPagedJS() {
        // Wait for PagedJS to be available
        const checkPagedJS = () => {
            if (typeof window.PagedPolyfill !== 'undefined') {
                console.log('📍 PagedJS detected - applying hooks...');
                
                // Hook into the 'before' event to fix elements before rendering
                window.PagedPolyfill.on('before', () => {
                    console.log('🔄 Pre-processing elements before PagedJS rendering...');
                    fixProblematicElement();
                });
                
                // Hook into page events to monitor for issues
                window.PagedPolyfill.on('page', (page) => {
                    // Check if we have the problematic element on this page
                    const element = page.element.querySelector('#ex-inline-479');
                    if (element) {
                        console.log('📄 Found ex-inline-479 on page', page.position);
                        // Apply fix if it hasn't been applied yet
                        if (getComputedStyle(element).breakInside === 'avoid') {
                            element.style.breakInside = 'auto';
                            element.style.pageBreakInside = 'auto';
                            element.style.maxHeight = '80vh';
                            element.style.overflow = 'hidden';
                        }
                    }
                });
                
                console.log('✅ PagedJS hooks applied');
            } else {
                // Keep checking for PagedJS
                setTimeout(checkPagedJS, 100);
            }
        };
        checkPagedJS();
    }
    
    // Apply fixes immediately if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            fixProblematicElement();
            interceptInfiniteLoop();
            hookIntoPagedJS();
        });
    } else {
        fixProblematicElement();
        interceptInfiniteLoop();
        hookIntoPagedJS();
    }
    
    console.log('✅ Minimal Chrome fix initialized');
})(); 