// ==UserScript==
// @name         Block Popup Ad Links
// @description  Prevent popup ad links from navigating, but allow other event handlers to run. Auto-click blocked link text on load and dynamic changes.
// @version      0.0.8
// @author       Tung Do
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==
(() => {
    'use strict';

    const blockedDomains = ['shopee.vn', 'lazada.vn', 'tiktok.com', 'profitableratecpm.com', 'eyep.blog'];
    const whitelistedDomains = ['google.com', 'facebook.com'];

    const isBlockedLink = (text) => {
        const currentUrl = window.location.href;
        const currentHost = window.location.hostname;

        // If current page's domain is whitelisted, skip blocking entirely
        const isCurrentWhitelisted = whitelistedDomains.some((domain) => currentHost.includes(domain));
        if (isCurrentWhitelisted) return false;

        try {
            const urlHost = new URL(text).hostname;
            const isBlocked = blockedDomains.some((domain) => urlHost.includes(domain));
            return isBlocked && !currentUrl.includes(urlHost);
        } catch (e) {
            // If text isn't a valid URL, ignore it
            return false;
        }
    };

    // Block navigation on click
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[href], span, div, p');
        if (!link) return;

        const rawText = link.getAttribute('href') || link.textContent.trim();

        let href;
        try {
            const url = new URL(rawText, location.href);
            href = url.href;
        } catch {
            return; // Not a valid URL, ignore
        }

        if (isBlockedLink(href)) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Navigation blocked for:', href);

            // Optional: visually indicate it's blocked
            link.style.pointerEvents = 'none';
            link.style.opacity = '0.5';

            return false;
        }
    });

    // Block window.open
    window.open = new Proxy(window.open, {
        apply(target, thisArg, args) {
            const [url] = args;
            if (isBlockedLink(url)) {
                console.log('Blocked window.open for:', url);
                return null;
            }
            return Reflect.apply(target, thisArg, args);
        },
    });

    //find empty popup div
    const divs = document.querySelectorAll('div, a');
    Array.from(divs)
        .filter((div) => {
            const style = window.getComputedStyle(div);
            const isPositioned = style.position === 'absolute' || style.position === 'fixed';
            const isEmpty = div.children.length === 0 && div.textContent.trim() === '';
            return isPositioned && isEmpty;
        })
        .forEach((div) => {
            div.remove();
        });

    const clickedUrls = new Set();

    const findAndClickBlockedLinks = () => {
        document.querySelectorAll('[href], span, div, p').forEach((el) => {
            const rawText = el.getAttribute('href') || el.textContent.trim();
            let href;
            try {
                const url = new URL(rawText, location.href); // handle relative and absolute URLs
                href = url.href;
            } catch (e) {
                return; // Not a valid URL, skip
            }
            if (isBlockedLink(href) && !clickedUrls.has(href)) {
                waitForElement(el).then((resolvedEl) => {
                    if (!resolvedEl || clickedUrls.has(href)) return;
                    console.log('Auto-clicking blocked link:', href);
                    resolvedEl.click();
                    clickedUrls.add(href);
                });
            }
        });
    };

    // Safe way to start observing after body is available
    function startObservingBlockedLinks() {
        const observer = new MutationObserver(findAndClickBlockedLinks);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Wait for <body> to exist before observing
    function waitForBodyAndObserve() {
        if (document.body) {
            findAndClickBlockedLinks(); // Initial run
            startObservingBlockedLinks(); // Attach observer
        } else {
            new MutationObserver((mutations, tempObserver) => {
                if (document.body) {
                    tempObserver.disconnect();
                    findAndClickBlockedLinks();
                    startObservingBlockedLinks();
                }
            }).observe(document.documentElement, { childList: true, subtree: true });
        }
    }

    // This runs when window has fully loaded
    window.addEventListener('load', findAndClickBlockedLinks);

    // This runs ASAP after script runs
    waitForBodyAndObserve();

    function waitForElement(el, timeout = 7000) {
        return new Promise((resolve, reject) => {
            const endTime = Date.now() + timeout;
            (function checkVisibility() {
                if (el && el.offsetParent !== null) {
                    resolve(el);
                } else if (Date.now() > endTime) {
                    reject(new Error('Timeout: Element not visible'));
                } else {
                    setTimeout(checkVisibility, 100);
                }
            })();
        });
    }
})();
