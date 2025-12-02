"use client";

import { useEffect } from "react";
import { setupTokenRefresh } from "@/utils/auth";

// This component helps suppress hydration warnings from browser extensions
// and sets up automatic token refresh
export default function HydrationFix() {
  useEffect(() => {
    // Suppress React hydration warnings for browser extension attributes
    if (typeof window !== 'undefined') {
      const originalError = console.error;
      const hydrationErrorPattern = /Hydration|bis_skin_checked|bis_register|__processed_/i;
      
      console.error = function(...args) {
        // Filter out hydration errors related to browser extensions
        if (args.some(arg => typeof arg === 'string' && hydrationErrorPattern.test(arg))) {
          return;
        }
        originalError.apply(console, args);
      };
      
      // Set up token refresh listener
      const unsubscribeAuth = setupTokenRefresh();
      
      return () => {
        console.error = originalError;
        if (unsubscribeAuth) {
          unsubscribeAuth();
        }
      };
    }
  }, []);

  return null;
}

