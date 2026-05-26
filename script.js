// ==UserScript==
// @name         Block Popup Ad Links
// @description  Remove transparent overlays + auto-click affiliate links
// @version      1.0.0
// @author       Tung Do
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
    'use strict';

    const blockedDomains = ['shopee.vn', 'lazada.vn', 'vt.tiktok.com', 'profitableratecpm.com', 'eyep.blog', 's99s.net'];
    const whitelisted = ['google.com', 'facebook.com'];

    if (whitelisted.some(d => location.hostname.includes(d))) return;

    const processedUrls = new Set();

    const isBlocked = (url) => {
        try {
            return blockedDomains.some(d => new URL(url, location.href).hostname.includes(d));
        } catch { return false; }
    };

    // Remove transparent overlays
    const removeOverlays = () => {
        // Find all fixed/absolute positioned elements with high z-index
        const allElements = document.querySelectorAll('*');

        allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            const position = style.position;
            const zIndex = parseInt(style.zIndex);

            // Check if it's an overlay
            if ((position === 'fixed' || position === 'absolute') && zIndex > 100) {
                const rect = el.getBoundingClientRect();
                const isFullScreen = rect.width >= window.innerWidth - 50 &&
                                    rect.height >= window.innerHeight - 50;

                if (isFullScreen) {
                    console.log('Removing overlay:', el.id || el.className || 'unnamed');
                    el.remove();
                }
            }
        });
    };

    // Auto-click affiliate links
    const neutralizeLink = (link) => {
        if (processedUrls.has(link.href)) return;

        processedUrls.add(link.href);

        link.href = '#';
        link.removeAttribute('target');

        setTimeout(() => {
            link.click();
        }, 150);
    };

    // Scan for links
    const scan = () => {
        document.querySelectorAll('a[href]').forEach(link => {
            if (isBlocked(link.href) && !processedUrls.has(link.href)) {
                neutralizeLink(link);
            }
        });
        removeOverlays();
    };

    // Block window.open
    window.open = new Proxy(window.open, {
        apply(target, _, args) {
            if (args[0] && isBlocked(args[0])) {
                console.log('Blocked popup:', args[0]);
                return null;
            }
            return target(...args);
        }
    });

    // Run initial scan
    scan();

    // Observe DOM changes and run both scan and removeOverlays
    const observer = new MutationObserver(() => {
        scan();
    });

    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });

    console.log('✅ Active - observing DOM changes for both links and overlays');

})();
