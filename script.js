// ==UserScript==
// @name         Block Popup Ad Links (Universal Clicker)
// @description  Universally auto-clicks ad/affiliate links once to trigger site unlocks, while instantly killing the popups.
// @version      0.5.0
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

    // Keeps track of elements we have already auto-clicked so we never click them twice
    const clickedElements = new WeakSet();

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
    window.open = new Proxy(window.open, {
        apply(target, thisArg, args) {
            const url = args?.[0];

            if (url && isBlockedUrl(url)) {
                console.log('Intercepted ad window.open -> Closing popup window instantly:', url);
                const win = Reflect.apply(target, thisArg, args);
                if (win) {
                    // 50ms is just enough time for the browser to register the open action
                    // and allow win.close() to execute successfully without being blocked.
                    setTimeout(() => {
                        try { win.close(); } catch (e) { console.log('Popup close blocked or already closed'); }
                    }, 50);
                }
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

        elements.forEach(el => {
            if (clickedElements.has(el)) return;

            const url = el.href || el.getAttribute('data-href') || el.getAttribute('data-url');

            if (url && isBlockedUrl(url)) {
                clickedElements.add(el);
                foundAdThisCycle = true;

                console.log('Universal Scanner found ad link. Clicking and clearing interval:', url);
                el.click();
            }
        });

        // If we found and clicked an ad, OR if we hit the 10-second limit, kill the interval
        if (foundAdThisCycle || attempts >= maxAttempts) {
            if (attempts >= maxAttempts && !foundAdThisCycle) {
                console.log('10 seconds elapsed without finding any ad popups. Stopping scanner.');
            }
            clearInterval(clickerInterval);
        }
    }, 500);

})();
