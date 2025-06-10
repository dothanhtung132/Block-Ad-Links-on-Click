// ==UserScript==
// @name         Block Popup Ad Links
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
        const link = e.target.closest('[href]') || e.target;
        const url = link.getAttribute('href');
        if (link && isBlockedLink(url)) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Navigation blocked for:', url);
        }
    });

    const originalWindowOpen = window.open;
    window.open = (url, ...args) => {
        if (isBlockedLink(url)) return null;
        return originalWindowOpen.call(window, url, ...args);
    };

})();
