// ==UserScript==
// @name         Block Popup Ad Links
// @description  Remove transparent overlays + auto-click affiliate links
// @version      1.0.2
// @author       Tung Do
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
    'use strict';

    const blockedDomains = ['shopee.vn', 'lazada.vn', 'vt.tiktok.com', 'profitableratecpm.com', 'eyep.blog', 's99s.net'];
    const whitelisted = ['google.com', 'facebook.com', 'youtube.com'];

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
        const allElements = document.querySelectorAll('div');

        allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            const position = style.position;
            const zIndex = parseInt(style.zIndex);

            // Check if it's an overlay
            if ((position === 'fixed' || position === 'absolute')) {
                const rect = el.getBoundingClientRect();
                const isFullScreen = rect.width >= window.innerWidth - 50 &&
                      rect.height >= window.innerHeight - 50;

                if (isFullScreen) {
                    // Check if element is empty or has no visible content
                    const hasContent = el.innerText.trim().length > 0 ||
                          el.querySelector('img, video, iframe, button, a, input') !== null;

                    const isVisible = style.display !== 'none' &&
                          style.visibility !== 'hidden' &&
                          parseFloat(style.opacity) > 0;

                    // Only remove if it's empty OR invisible (transparent overlay)
                    if (!hasContent && isVisible) {
                        console.log('Removing empty/invisible overlay:', el.id || el.className || 'unnamed');
                        el.remove();
                    }
                }
            }
        });
    };

    // Auto-click affiliate links
    const neutralizeLink = (link) => {
        const originalUrl = link.href;

        if (processedUrls.has(originalUrl)) return;
        processedUrls.add(originalUrl);

        // Call their onclick handler directly (doesn't navigate)
        if (link.onclick) {
            link.onclick({ preventDefault: () => {} });
        }

        // Also try clicking (with preventDefault)
        link.addEventListener('click', (e) => {
            e.preventDefault();
        }, { once: true });

        link.click();

        // Then neutralize after
        setTimeout(() => {
            link.href = '#';
            link.removeAttribute('target');
        }, 500);
    };

    // Scan for links
    const scan = () => {
        document.querySelectorAll('a[href]').forEach(link => {
            const isVisible = link.offsetParent !== null;
            if (isVisible && isBlocked(link.href) && !processedUrls.has(link.href)) {
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
})();
