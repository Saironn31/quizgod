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
      const adId = `container-native-${Date.now()}`;
      
      // Create container with ID
      const adDiv = document.createElement('div');
      adDiv.id = adId;
      
      // Create script
      const script = document.createElement('script');
      script.src = '//pl28077859.effectivegatecpm.com/400ff7b83cddd25498abd1bd7e49928e/invoke.js';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.onerror = () => console.error('Failed to load Adsterra native ad');
      
      containerRef.current.appendChild(adDiv);
      containerRef.current.appendChild(script);
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
      <div ref={containerRef} style={{ minHeight: 250, width: '100%' }}></div>
    </div>
  );
}
