// ==UserScript==
// @name         Block Popup Ad Links
// @description  Prevent popup ad links from navigating, but allow other event handlers to run. Auto-click blocked link text on load and dynamic changes.
// @version      0.0.7
// @author       Tung Do
// @match        *://*/*
// @grant        none
// ==/UserScript==
(() => {
    'use strict';

    const blockedDomains = ['shopee.vn', 'lazada.vn', 'tiktok.com', 't.co/', 'profitableratecpm.com', 'eyep.blog', 'facebook.com'];

    const isBlockedLink = (text) => blockedDomains.some((domain) => text.includes(domain));

    const preventNavigation = (url) => {
        console.log('Navigation blocked for:', url);
        return false;
    };

    // Block navigation on click
    document.addEventListener('click', (e) => {
        const linkEl = e.target.closest('[href], span, div, p');
        if (linkEl) {
            const url = linkEl.getAttribute?.('href') || linkEl.textContent?.trim();
            if (url && isBlockedLink(url)) {
                e.preventDefault?.();
                e.stopPropagation?.();
                preventNavigation(url);
            }
        }
    });

    // Block window.open
    window.open = new Proxy(window.open, {
        apply(target, thisArg, args) {
            const [url] = args;
            if (isBlockedLink(url)) {
                console.log('Blocked window.open for:', url);
                document.querySelectorAll('span, div, p').forEach((el) => {
                    if (el.textContent.trim() === url) el.remove();
                });
                return null;
            }
            return Reflect.apply(target, thisArg, args);
        },
    });

    //find empty popup div
    const divs = document.querySelectorAll('div, a');
    const emptyPositionedDivs = Array.from(divs).filter((div) => {
        const style = window.getComputedStyle(div);
        const isPositioned = style.position === 'absolute' || style.position === 'fixed';
        const isEmpty = div.children.length === 0 && div.textContent.trim() === '';
        return isPositioned && isEmpty;
    });

    emptyPositionedDivs.forEach((div) => {
        div.remove();
    });

    const findAndClickBlockedLinks = () => {
        document.querySelectorAll('a[href], span, div, p').forEach((el) => {
            const text = el.getAttribute('href') || el.textContent.trim();
            if (text.startsWith('http') && isBlockedLink(text)) {
                waitForElement(el)
                    .then((el) => {
                        el.click();
                        console.log('Auto-clicking blocked link:', text);
                    })
                    .then(() => el.remove())
                    .catch(console.error);
            }
        });
    };

    window.addEventListener('load', findAndClickBlockedLinks);

    const observer = new MutationObserver(findAndClickBlockedLinks);
    observer.observe(document.body, { childList: true, subtree: true });

    function waitForElement(el, timeout = 10000) {
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
