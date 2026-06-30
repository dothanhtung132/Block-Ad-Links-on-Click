// ==UserScript==
// @name          Block Popup Ad Links
// @description   Auto-click affiliate links to unlock content without navigating
// @version       1.0.5
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

    const isBlocked = (url) => {
        try {
            if (url === '#') return false;
            return blockedDomains.some(d => new URL(url, location.href).hostname.includes(d));
        } catch { return false; }
    };

    const processedLinks = new WeakSet();

    const findHiddenAncestor = (link) => {
        let el = link.parentElement;
        while (el) {
            if (window.getComputedStyle(el).display === 'none') return el;
            el = el.parentElement;
        }
        return null;
    };

    const triggerSafeClick = (link) => {
        link.addEventListener('click', e => e.preventDefault(), { once: true });
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        link.removeAttribute('target');
        link.removeAttribute('href');
    };

    const neutralizeLink = (link) => {
        if (processedLinks.has(link)) return;
        processedLinks.add(link);

        const hiddenAncestor = findHiddenAncestor(link);
        if (!hiddenAncestor) {
            triggerSafeClick(link);
            return;
        }

        const observer = new MutationObserver(() => {
            if (window.getComputedStyle(hiddenAncestor).display !== 'none') {
                observer.disconnect();
                triggerSafeClick(link);
            }
        });
        observer.observe(hiddenAncestor, { attributes: true, attributeFilter: ['style', 'class'] });
    };

    const scan = () => {
        document.querySelectorAll('a[href]').forEach(link => {
            if (isBlocked(link.href)) {
                neutralizeLink(link);
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
        const target = document.body || document.documentElement;
        if (!target) return;
        mutationObserver.observe(target, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class'],
        });
    };

    const init = () => {
        startObserver();
        scan();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
