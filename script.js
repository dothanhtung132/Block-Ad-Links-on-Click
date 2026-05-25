// ==UserScript==
// @name         Block Popup Ad Links
// @description  Universally auto-clicks ad/affiliate links once to trigger site unlocks, while instantly killing the popups.
// @version      0.8.0
// @author       Tung Do
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
    'use strict';

    const blockedDomains = new Set([
        'shopee.vn',
        'lazada.vn',
        'tiktok.com',
        'profitableratecpm.com',
        'eyep.blog',
        's99s.net'
    ]);

    const whitelistedDomains = new Set([
        'google.com',
        'facebook.com'
    ]);

    const getBaseDomain = (host) => {
        const parts = host.split('.');
        return parts.slice(-2).join('.');
    };

    const currentHost = window.location.hostname;
    const currentBase = getBaseDomain(currentHost);

    if ([...whitelistedDomains].some(d => currentHost.includes(d))) return;

    const isBlockedUrl = (url) => {
        try {
            if (!url || url.startsWith('#') || url.startsWith('javascript:')) return false;
            const host = new URL(url, window.location.href).hostname;
            const base = getBaseDomain(host);

            return (
                [...blockedDomains].some(d => host === d || host.endsWith('.' + d)) &&
                base !== currentBase
            );
        } catch {
            return false;
        }
    };

    // -------------------------------------------------------------
    // 1. Universal Catch: Proxy window.open to instantly close ad tabs
    // -------------------------------------------------------------
    const closeWindowSafely = (win, url) => {
        if (win) {
            console.log('Intercepted popup open -> Closing instantly:', url);
            setTimeout(() => {
                try { win.close(); } catch (e) { console.log('Popup already closed or inaccessible.'); }
            }, 50);
        }
    };

    window.open = new Proxy(window.open, {
        apply(target, thisArg, args) {
            const url = args?.[0];
            if (url && isBlockedUrl(url)) {
                const win = Reflect.apply(target, thisArg, args);
                closeWindowSafely(win, url);
                return win;
            }
            return Reflect.apply(target, thisArg, args);
        }
    });

    // -------------------------------------------------------------
    // 2. Universal Clicker loop (Runs every 500ms, expires after 10s)
    // -------------------------------------------------------------
    let attempts = 0;
    const maxAttempts = 20; // 20 attempts * 500ms = 10 seconds total

    const clickerInterval = setInterval(() => {
        attempts++;
        const elements = document.querySelectorAll('a[href], [data-href], [data-url]');
        let foundAdThisCycle = false;

        // We use a classic for...of loop here because you cannot 'break' out of a .forEach()
        for (const el of elements) {
            const url = el.href || el.getAttribute('data-href') || el.getAttribute('data-url');

            if (url && isBlockedUrl(url)) {
                foundAdThisCycle = true;

                console.log('Universal Scanner processing single ad link:', url);

                // 1. Trigger the logic
                el.click();

                // 2. Remove ONLY this specific node
                setTimeout(() => {
                    el.remove();
                }, 50);

                // 3. BREAK OUT! Do not touch any duplicate elements until the next 500ms cycle
                break;
            }
        }

        // Keep scanning for the full 10 seconds to catch delayed duplicates or popups
        if (attempts >= maxAttempts) {
            console.log('10 seconds elapsed. Stopping scanner.');
            clearInterval(clickerInterval);
        }
    }, 500);

})();
