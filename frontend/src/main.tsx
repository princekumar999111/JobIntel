import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Normalize API calls to the configured backend when running in the browser.
// This ensures all calls to /api/* go to the backend specified by VITE_API_URL
// (set in Netlify environment variables) instead of being routed to the static host.
if (typeof window !== 'undefined') {
  let backendBase = '';

  // Priority 1: GitHub Codespaces detection (should override all other settings in Codespaces)
  // GitHub Codespaces URLs look like: animated-adventure-97v7j6ppqxq5f7w7q-8080.app.github.dev
  // We need to extract the base ID and construct backend URL for port 4000
  if (window.location.hostname.includes('github.dev')) {
    const match = window.location.hostname.match(/^(.+?)-\d+\.app\.github\.dev$/);
    if (match) {
      const baseId = match[1];
      backendBase = `https://${baseId}-4000.app.github.dev`;
      console.log('[runtime] GitHub Codespaces detected, backend URL:', backendBase);
    }
  }

  // Priority 2: Build-time VITE_API_URL (for production/Netlify)
  if (!backendBase) {
    const envBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    if (envBase) {
      backendBase = envBase;
      console.log('[runtime] Using VITE_API_URL:', backendBase);
    }
  }

  // Priority 3: Fallback for the public Netlify site if env wasn't provided during build
  if (!backendBase) {
    const host = window.location.hostname;
    if (host === 'jobintell.netlify.app') {
      backendBase = 'https://jobintel-backend.onrender.com';
      console.warn('[runtime] VITE_API_URL not set — falling back to', backendBase);
    }
  }

  // Determine if we're in development mode (localhost)
  const isDev = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' || 
                window.location.hostname === '0.0.0.0' ||
                window.location.hostname.startsWith('10.') ||  // Local network
                window.location.hostname.startsWith('192.168.') ||  // Local network
                import.meta.env.DEV;  // Vite dev mode flag
  
  const isNetlifyDeploy = window.location.hostname === 'jobintell.netlify.app' || window.location.hostname.includes('netlify');
  const isCodespaces = window.location.hostname.includes('github.dev');
  
  console.log('[main.tsx] Environment:', {
    hostname: window.location.hostname,
    isDev,
    isNetlifyDeploy,
    isCodespaces,
    backendBase,
    VITE_API_URL: import.meta.env.VITE_API_URL
  });
  
  // Patch fetch for:
  // 1. GitHub Codespaces (always, regardless of isDev flag)
  // 2. Production Netlify deployments (when not in localhost dev)
  const shouldPatchFetch = (isCodespaces && backendBase) || (backendBase && !isDev && isNetlifyDeploy);
  
  if (shouldPatchFetch) {
    console.log('[fetch-patch] Patching fetch to use backend:', backendBase);
    const origFetch = window.fetch.bind(window);
    // @ts-ignore - augment global fetch
    window.fetch = (input: RequestInfo, init?: RequestInit) => {
      try {
        if (typeof input === 'string' && input.startsWith('/api/')) {
          const newInput = backendBase + input;
          console.log('[fetch-patch] Converting:', input, '→', newInput);
          input = newInput;
        }
      } catch (e) {
        // ignore
      }
      return origFetch(input, init);
    };

    // Patch EventSource to use absolute backend base for relative API stream paths
    // @ts-ignore
    const OrigEventSource = window.EventSource;
    // @ts-ignore
    window.EventSource = function(url: string, ...args: any[]) {
      let u = url;
      try {
        if (typeof u === 'string' && u.startsWith('/api/')) {
          console.log('[sse-patch] Converting EventSource URL:', u, '→', backendBase + u);
          u = backendBase + u;
        }
      } catch (e) {
        // ignore
      }
      // @ts-ignore
      return new OrigEventSource(u, ...args);
    } as any;
  } else {
    console.log('[api-setup] Development mode - using Vite proxy or direct backend for /api/* calls');
  }
}

createRoot(document.getElementById("root")!).render(<App />);
