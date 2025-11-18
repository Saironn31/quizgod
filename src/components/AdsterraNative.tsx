"use client";
import { useEffect, useRef } from 'react';

export default function AdsterraNative() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptAdded = useRef(false);

  useEffect(() => {
    if (containerRef.current && !scriptAdded.current) {
      const script = document.createElement('script');
      script.src = '//pl28077859.effectivegatecpm.com/400ff7b83cddd25498abd1bd7e49928e/invoke.js';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      
      containerRef.current.appendChild(script);
      scriptAdded.current = true;
    }
  }, []);

  return (
    <div className="my-4">
      <div ref={containerRef} id="container-400ff7b83cddd25498abd1bd7e49928e"></div>
    </div>
  );
}
