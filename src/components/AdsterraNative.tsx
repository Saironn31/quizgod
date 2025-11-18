"use client";
import { useEffect } from 'react';

export default function AdsterraNative() {
  useEffect(() => {
    // Load the script dynamically
    const script = document.createElement('script');
    script.src = '//pl28077859.effectivegatecpm.com/400ff7b83cddd25498abd1bd7e49928e/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    
    const container = document.getElementById('container-400ff7b83cddd25498abd1bd7e49928e');
    if (container && !container.querySelector('script')) {
      container.parentElement?.insertBefore(script, container);
    }
  }, []);

  return <div id="container-400ff7b83cddd25498abd1bd7e49928e" className="my-4"></div>;
}
