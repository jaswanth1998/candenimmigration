(function () {
    "use strict";

    // The plaintext password is intentionally NOT stored on the page.
    // Pages expose only a SHA-256 hash via window.SITE_PREVIEW_PASSWORD_HASH;
    // the password the visitor types is hashed in the browser and compared
    // against it. This keeps the password out of "view source", though a
    // client-side gate can never be fully secure.
    var configuredHash = window.SITE_PREVIEW_PASSWORD_HASH;
    if (!configuredHash) {
        return;
    }
    configuredHash = String(configuredHash).toLowerCase();

    var storageKey = "canden_preview_unlocked";

    var isUnlocked = false;
    try {
        isUnlocked = window.sessionStorage.getItem(storageKey) === "true";
    } catch (err) {
        isUnlocked = false;
    }
    if (isUnlocked) {
        return;
    }

    // Web Crypto's SHA-256 is only available in a secure context (https or
    // localhost). GitHub Pages and local dev over localhost both qualify.
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
        return;
    }

    // Hide the page until access is granted so protected content never flashes
    // while the (async) hash is being computed.
    var rootEl = document.documentElement;
    var previousVisibility = rootEl.style.visibility;
    rootEl.style.visibility = "hidden";

    function reveal() {
        rootEl.style.visibility = previousVisibility;
    }

    function denyAccess() {
        // Stop the page from loading any further so protected markup/assets
        // stop streaming in, then cover whatever exists with an opaque overlay.
        // The root <html> stays visibility:hidden; the overlay re-enables
        // visibility only on itself, so the real content never shows even if
        // the HTML parser had already appended part of it.
        try {
            window.stop();
        } catch (err) {
            // Ignore — window.stop is unavailable in some embedded contexts.
        }

        var overlay = document.createElement("div");
        overlay.setAttribute(
            "style",
            "visibility:visible;position:fixed;inset:0;z-index:2147483647;margin:0;background:#f4f4f4;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;"
        );
        overlay.innerHTML = "<div style=\"text-align:center;padding:24px;background:#fff;border:1px solid #ddd;border-radius:8px;\"><h2 style=\"margin:0 0 8px;\">Protected Preview</h2><p style=\"margin:0;color:#555;\">You do not have access to this page.</p></div>";
        (document.body || document.documentElement).appendChild(overlay);

        throw new Error("Preview access denied");
    }

    function sha256Hex(text) {
        var data = new window.TextEncoder().encode(text);
        return window.crypto.subtle.digest("SHA-256", data).then(function (buffer) {
            var bytes = new Uint8Array(buffer);
            var hex = "";
            for (var i = 0; i < bytes.length; i++) {
                var byteHex = bytes[i].toString(16);
                hex += byteHex.length === 1 ? "0" + byteHex : byteHex;
            }
            return hex;
        });
    }

    function attempt(remaining) {
        var userPassword = window.prompt("This website is password protected. Enter password:");

        if (userPassword === null) {
            denyAccess();
            return;
        }

        sha256Hex(userPassword).then(function (hash) {
            if (hash === configuredHash) {
                try {
                    window.sessionStorage.setItem(storageKey, "true");
                } catch (err) {
                    // Ignore storage errors and allow this page load.
                }
                reveal();
                return;
            }

            if (remaining > 1) {
                window.alert("Incorrect password. Please try again.");
                attempt(remaining - 1);
            } else {
                window.alert("Access denied.");
                denyAccess();
            }
        });
    }

    attempt(3);
})();
