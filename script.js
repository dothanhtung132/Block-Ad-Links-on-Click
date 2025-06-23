// ==UserScript==
// @name         Block Popup Ad Links
// @description  Prevent popup ad links from navigating, but allow other event handlers to run. On load, auto-click blocked links.
// @version      0.0.3
// @author       Tung Do
// @match        *://*/*
// @grant        none
// ==/UserScript==
(() => {
    'use strict';

    const blockedDomains = ['shopee.vn', 'lazada.vn', 'tiktok.com', 't.co/', 'profitableratecpm.com'];

    const isBlockedLink = href =>
        blockedDomains.some(domain => href.includes(domain));

    // Block navigation on click
    document.addEventListener('click', e => {
        const link = e.target.closest('a[href]');
        if (link) {
            const url = link.getAttribute('href');
            if (url && isBlockedLink(url)) {
                e.preventDefault();
                console.log('Navigation blocked for:', url);
            }
        }
    });

    // Block window.open
    const originalWindowOpen = window.open;
    window.open = (url, ...args) => {
        if (isBlockedLink(url)) {
            console.log('Blocked window.open for:', url);
            return null;
        }
        return originalWindowOpen.call(window, url, ...args);
    };

    // On load, find all blocked links and click them
    window.addEventListener('load', () => {
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            const url = link.getAttribute('href');
            if (url && isBlockedLink(url)) {
                console.log('Auto-clicking blocked link:', url);
                link.click();
            }
        });
    });

})();
