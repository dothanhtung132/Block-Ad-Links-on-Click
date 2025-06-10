// ==UserScript==
// @name         Block Popup Ad Links (Optimized)
// @description  Prevent popup ad links from navigating, but allow other event handlers to run
// @version      0.0.2
// @author       Tung Do
// @match        *://*/*
// @grant        none
// ==/UserScript==
(() => {
    'use strict';

    const blockedDomains = ['shopee', 'lazada', 'tiktok', 't.co'];

    const isBlockedLink = href =>
        blockedDomains.some(domain => href.includes(domain));

    document.addEventListener('click', e => {
        const link = e.target.closest('a');
        if (link && isBlockedLink(link.href)) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Navigation blocked for:', link.href);
        }
    });
})();
