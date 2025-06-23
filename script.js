// ==UserScript==
// @name         Block Popup Ad Links
// @description  Prevent popup ad links from navigating, but allow other event handlers to run. Auto-click blocked links on load and dynamic changes.
// @version      0.0.4
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

    // Find & click blocked links
    const findAndClickBlockedLinks = () => {
        document.querySelectorAll('a[href]').forEach(link => {
            const url = link.getAttribute('href');
            if (url && isBlockedLink(url)) {
                console.log('Auto-clicking blocked <a> link:', url);
                link.click();
            }
        });

        // Span, div, p with link-like text
        document.querySelectorAll('span, div, p').forEach(el => {
            const text = el.textContent.trim();
            if (text.startsWith('http') && isBlockedLink(text)) {
                console.log('Auto-clicking blocked text link:', text);
                el.click();
            }
        });
    };

    // Run once on load
    window.addEventListener('load', findAndClickBlockedLinks);

    // Observe dynamic DOM changes
    const observer = new MutationObserver(() => {
        findAndClickBlockedLinks();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
