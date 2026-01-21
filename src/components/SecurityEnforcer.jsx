"use client";
import { useEffect } from "react";

const SecurityEnforcer = () => {
    useEffect(() => {
        // Helper to safe clear clipboard
        const safeClearClipboard = () => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText("").catch((err) => {
                    // Suppress NotAllowedError which happens if not focused
                    console.warn("Clipboard clear prevented:", err);
                });
            }
        };

        // Helper to hide/show content
        const setContentVisibility = (visible) => {
            const value = visible ? "visible" : "hidden";
            document.documentElement.style.visibility = value;

            // Also blank the clipboard if hiding
            if (!visible) {
                safeClearClipboard();
            }
        };

        // 1. Disable Back Button
        const handlePopState = () => {
            window.history.pushState(null, "", window.location.href);
        };
        window.history.pushState(null, "", window.location.href);
        window.addEventListener("popstate", handlePopState);

        // 2. Disable Page Refresh
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        // 3. Lock Keys (Aggressive)
        const lockKeys = async () => {
            if ('keyboard' in navigator && 'lock' in navigator.keyboard) {
                try {
                    // This creates the "exclusive" lock that prevents the OS overlay
                    await navigator.keyboard.lock(["Escape", "PrintScreen"]);
                } catch (err) {
                    console.log(err);
                }
            }
        };
        // Trigger lock on any interaction
        window.addEventListener('click', lockKeys);
        window.addEventListener('keydown', lockKeys);
        window.addEventListener('mousedown', lockKeys);
        window.addEventListener('focus', lockKeys); // Added focus listener

        // 4. Handle Key Down (Block Shortcuts)
        const handleKeyDown = (e) => {
            // Block standard shortcuts
            if (
                e.key === "F5" ||
                (e.ctrlKey && (e.key === "r" || e.key === "R")) ||
                (e.key === "F12") ||
                (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
                (e.ctrlKey && (e.key === "u" || e.key === "U")) ||
                (e.key === "Escape")
            ) {
                e.preventDefault();
                e.stopPropagation();
            }

            // DETECT PRINT SCREEN
            if (e.key === "PrintScreen") {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                // Immediately hide content
                setContentVisibility(false);
                return false;
            }
        };
        window.addEventListener("keydown", handleKeyDown, true);

        // 5. Handle Key Up
        const handleKeyUp = (e) => {
            if (e.key === "PrintScreen") {
                // DO NOT automatically show content here.
                // The Snipping Tool overlay might still be open.
                // We leave it hidden until the user clicks back (Focus event).
                safeClearClipboard();
            }
        };
        window.addEventListener("keyup", handleKeyUp, true);

        // 6. WINDOW BLUR (Crucial for Snipping Tool)
        // When the Snipping Tool bar opens, the browser loses focus.
        // We immediately hide the screen.
        const handleWindowBlur = () => {
            setContentVisibility(false); // Hide everything
        };

        // 7. WINDOW FOCUS
        // When they close the tool and click back on the test, we show content.
        const handleWindowFocus = () => {
            setContentVisibility(true); // Show everything
            lockKeys(); // Re-apply lock
        };

        window.addEventListener("blur", handleWindowBlur);
        window.addEventListener("focus", handleWindowFocus);

        // 8. Disable Context Menu
        const handleContextMenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        window.addEventListener("contextmenu", handleContextMenu, true);

        // 9. Disable Copy/Paste
        const handleCopyCutPaste = (e) => {
            e.preventDefault();
        }
        window.addEventListener("copy", handleCopyCutPaste, true);
        window.addEventListener("cut", handleCopyCutPaste, true);
        window.addEventListener("paste", handleCopyCutPaste, true);

        // Cleanup
        return () => {
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("keydown", handleKeyDown, true);
            window.removeEventListener("keyup", handleKeyUp, true);
            window.removeEventListener("blur", handleWindowBlur);
            window.removeEventListener("focus", handleWindowFocus);
            window.removeEventListener("contextmenu", handleContextMenu, true);
            window.removeEventListener("copy", handleCopyCutPaste, true);
            window.removeEventListener("cut", handleCopyCutPaste, true);
            window.removeEventListener("paste", handleCopyCutPaste, true);
            window.removeEventListener('click', lockKeys);
            window.removeEventListener('keydown', lockKeys);
            window.removeEventListener('mousedown', lockKeys);
            window.removeEventListener('focus', lockKeys);
        };
    }, []);

    return null;
};

export default SecurityEnforcer;