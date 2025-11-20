"use client";
import { useEffect, useRef } from 'react';

export default function AdsterraNative() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear previous content
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    if (containerRef.current) {
      // Create the exact container structure from Adsterra
      const adContainer = document.createElement('div');
      adContainer.id = 'container-400ff7b83cddd25498abd1bd7e49928e';
      
      // Create script with exact attributes from Adsterra
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = '//pl28077859.effectivegatecpm.com/400ff7b83cddd25498abd1bd7e49928e/invoke.js';
      script.onerror = () => console.error('Failed to load Adsterra native ad');
      
      // Append in correct order: script first, then container
      containerRef.current.appendChild(script);
      containerRef.current.appendChild(adContainer);
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="my-4 flex justify-center">
      <div ref={containerRef} style={{ minHeight: 250, width: '100%', maxWidth: 728 }}></div>
    </div>
  );
}
