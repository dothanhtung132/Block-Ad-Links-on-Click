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

    const blockedDomains = ['shopee.vn', 'lazada.vn', 'tiktok.com', 't.co'];

    const isBlockedLink = href =>
        blockedDomains.some(domain => href.includes(domain));

    document.addEventListener('click', e => {
        const link = e.target.closest('[href]') || e.target;
        const url = link.getAttribute('href');
        if (url && isBlockedLink(url)) {
            e.preventDefault();
            console.log('Navigation blocked for:', url);
        }
    });

    const originalWindowOpen = window.open;
    window.open = (url, ...args) => {
        if (url && isBlockedLink(url)) return null;
        return originalWindowOpen.call(window, url, ...args);
    };

})();
