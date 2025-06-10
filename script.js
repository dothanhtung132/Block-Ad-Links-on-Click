// ==UserScript==
// @name         Block Popup Ad Links (Non-intrusive)
// @description  Prevent links from opening new pages, but keep other event handlers active
// @author       Tung Do
// @version      0.0.1
// @match        *://*/*
// @grant        none
// ==/UserScript==
(function () {
    'use strict';

    // List of domains to block
    const blockedDomains = [
        'shopee',
        'lazada',
        'tiktok'
    ];

    // Build selector
    const selector = blockedDomains
        .map(domain => `a[href*="${domain}"][target="_blank"]`)
        .join(', ');

    // Block only default link behavior (not other click handlers)
    document.querySelectorAll(selector).forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent navigation
            console.log('Navigation blocked for:', link.href);
            // Other handlers will still run
        }, false); // useCapture=false to run after other handlers if needed
    });
})();
