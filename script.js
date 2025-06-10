// ==UserScript==
// @name         Block Ad Links on Click
// @description  Prevent links that cause popup ads from opening
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

    // Create selector string from domains
    const selector = blockedDomains
        .map(domain => `a[href*="${domain}"][target="_blank"]`)
        .join(', ');

    // Attach click event to block opening
    document.querySelectorAll(selector).forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default link behavior
            e.stopPropagation(); // Stop event from bubbling up
        });
    });
})();