// ==UserScript==
// @name          Block Popup Ad Links
// @description   Auto-click affiliate links to unlock content without navigating
// @version       1.0.3
// @author        Tung Do
// @match         *://*/*
// @grant         none
// @run-at        document-start
// ==/UserScript==
(() => {
    'use strict';
    const blockedDomains = ['shopee.vn', 'lazada.vn', 'vt.tiktok.com', 'profitableratecpm.com', 'eyep.blog', 's99s.net'];
    const whitelisted = ['google.com', 'facebook.com', 'youtube.com', 'deepseek.com'];
    if (whitelisted.some(d => location.hostname.includes(d))) return;

    const processedUrls = new Set();

    const isBlocked = (url) => {
        try {
            return blockedDomains.some(d => new URL(url, location.href).hostname.includes(d));
        } catch { return false; }
    };

    const neutralizeLink = (link) => {
        const originalUrl = link.href;
        if (processedUrls.has(originalUrl)) return;
        processedUrls.add(originalUrl);

        link.href = '#';
        link.removeAttribute('target');
        link.click();
    };

    // Click the moment the link scrolls into view
    const intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                neutralizeLink(entry.target);
                intersectionObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0 });

    const scan = () => {
        document.querySelectorAll('a[href]').forEach(link => {
            if (isBlocked(link.href) && !processedUrls.has(link.href)) {
                intersectionObserver.observe(link);
            }
        });
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scan);
    } else {
        scan();
    }

    let debounceTimer;
    const mutationObserver = new MutationObserver((mutations) => {
        const shouldScan = mutations.some(m =>
            (m.type === 'childList' && m.addedNodes.length > 0) ||
            m.type === 'attributes'
        );
        if (shouldScan) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(scan, 100);
        }
    });

    const startObserver = () => {
        mutationObserver.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserver);
    } else {
        startObserver();
    }
})();
