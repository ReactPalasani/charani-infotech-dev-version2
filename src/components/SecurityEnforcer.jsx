"use client";
import { useEffect } from "react";

const SecurityEnforcer = () => {
    useEffect(() => {
        // 1. Disable Back Button
        const handlePopState = (event) => {
            window.history.pushState(null, "", window.location.href);
        };
        window.history.pushState(null, "", window.location.href);
        window.addEventListener("popstate", handlePopState);

        // 2. Disable Page Refresh (Confirm on Reload)
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = ""; // Chrome requires returnValue to be set
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        // Attempt to Lock Keyboard (specifically Escape) to prevent exiting Fullscreen
        const lockEscapeKey = async () => {
            if ('keyboard' in navigator && 'lock' in navigator.keyboard) {
                try {
                    await navigator.keyboard.lock(["Escape"]);
                    console.log("Escape key locked successfully");
                } catch (err) {
                    console.log("Keyboard lock failed (likely needs user gesture)", err);
                }
            }
        };

        lockEscapeKey();
        // Retry lock on first interaction
        window.addEventListener('click', lockEscapeKey, { once: true });
        window.addEventListener('keydown', lockEscapeKey, { once: true });

        // 3. Disable Specific Keys
        const handleKeyDown = (e) => {
            // Refresh: F5, Ctrl+R
            if (
                e.key === "F5" ||
                (e.ctrlKey && (e.key === "r" || e.key === "R"))
            ) {
                e.preventDefault();
            }

            // Print Screen (Prevent Default & Blur Screen)
            if (e.key === "PrintScreen") {
                e.preventDefault();
                // Immediately hide content to race against OS screenshot
                document.body.style.display = "none";

                navigator.clipboard.writeText("").catch((err) => {
                    // Fail silently
                    console.warn("Clipboard access denied", err);
                });
            }

            // Escape
            if (e.key === "Escape") {
                e.preventDefault();
            }

            // Delete
            if (e.key === "Delete") {
                e.preventDefault();
            }

            // Inspect: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
            if (
                e.key === "F12" ||
                (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) || // Added Ctrl+Shift+C (Element selector)
                (e.ctrlKey && (e.key === "u" || e.key === "U"))
            ) {
                e.preventDefault();
            }
        };
        window.addEventListener("keydown", handleKeyDown);

        // 4. Handle KeyUp (Restore content after PrintScreen)
        const handleKeyUp = (e) => {
            if (e.key === "PrintScreen") {
                // Restore content
                setTimeout(() => {
                    document.body.style.display = "";
                    alert("Screenshots are disabled during the exam.");
                }, 100);

                navigator.clipboard.writeText("").then(() => {
                }).catch((err) => {
                    console.warn("Clipboard access denied", err);
                });
            }
        };
        window.addEventListener("keyup", handleKeyUp);

        // 5. Blur Content on Window Blur (e.g. Snipping Tool usage)
        const handleWindowBlur = () => {
            document.body.style.filter = "blur(10px)";
        };
        const handleWindowFocus = () => {
            document.body.style.filter = "none";
        };
        window.addEventListener("blur", handleWindowBlur);
        window.addEventListener("focus", handleWindowFocus);

        // 5. Disable Right Click (Inspect)
        const handleContextMenu = (e) => {
            e.preventDefault();
        };
        window.addEventListener("contextmenu", handleContextMenu);

        // 6. Disable Copy/Cut/Paste
        const handleCopyCutPaste = (e) => {
            e.preventDefault();
        }
        window.addEventListener("copy", handleCopyCutPaste);
        window.addEventListener("cut", handleCopyCutPaste);
        window.addEventListener("paste", handleCopyCutPaste);


        // Cleanup
        return () => {
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("contextmenu", handleContextMenu);
            window.removeEventListener("copy", handleCopyCutPaste);
            window.removeEventListener("cut", handleCopyCutPaste);
            window.removeEventListener("paste", handleCopyCutPaste);
            window.removeEventListener("blur", handleWindowBlur);
            window.removeEventListener("focus", handleWindowFocus);
        };
    }, []);

    return null; // This component does not render anything
};

export default SecurityEnforcer;
