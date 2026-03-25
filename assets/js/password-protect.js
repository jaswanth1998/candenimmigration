(function () {
    "use strict";

    var configuredPassword = window.SITE_PREVIEW_PASSWORD;
    if (!configuredPassword) {
        return;
    }

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

    var maxAttempts = 3;
    var attempts = 0;
    var userPassword = "";

    while (attempts < maxAttempts) {
        userPassword = window.prompt("This website is password protected. Enter password:");

        if (userPassword === configuredPassword) {
            try {
                window.sessionStorage.setItem(storageKey, "true");
            } catch (err) {
                // Ignore storage errors and allow this page load.
            }
            return;
        }

        attempts += 1;

        if (userPassword === null) {
            break;
        }

        window.alert("Incorrect password. Please try again.");
    }

    window.alert("Access denied.");
    document.documentElement.innerHTML = "<head><title>Protected Preview</title></head><body style=\"font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f4f4f4;\"><div style=\"text-align:center;padding:24px;background:#fff;border:1px solid #ddd;border-radius:8px;\"><h2 style=\"margin:0 0 8px;\">Protected Preview</h2><p style=\"margin:0;color:#555;\">You do not have access to this page.</p></div></body>";
    throw new Error("Preview access denied");
})();