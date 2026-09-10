'use client';

import { useEffect } from 'react';

/**
 * This export is one document: hashes select sections and queries are DEMO
 * view state, not server routes. Let the prototypes restore their own state
 * without asking the RSC router to fetch a different server-rendered page.
 */
export default function PrototypeHistory() {
  useEffect(() => {
    const restore = (event: PopStateEvent) => {
      event.stopImmediatePropagation();
      window.dispatchEvent(new CustomEvent('hn:prototype-history'));
    };
    window.addEventListener('popstate', restore, true);
    return () => window.removeEventListener('popstate', restore, true);
  }, []);
  return null;
}
