"use client";
import { useEffect, useRef } from 'react';

interface AdsterraAdProps {
  atOptions: {
    key: string;
    format: string;
    height?: number;
    width?: number;
    params?: Record<string, any>;
  };
}

export default function AdsterraAd({ atOptions }: AdsterraAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear previous content
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    if (containerRef.current && atOptions.key) {
      // Create container div with unique ID
      const adContainer = document.createElement('div');
      adContainer.id = `adsterra-${atOptions.key}-${Date.now()}`;
      
      // Create the config script
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.innerHTML = `atOptions = ${JSON.stringify(atOptions)};`;
      
      // Create the ad script
      const adScript = document.createElement('script');
      adScript.type = 'text/javascript';
      adScript.src = `//www.highperformanceformat.com/${atOptions.key}/invoke.js`;
      adScript.async = true;
      adScript.onerror = () => console.error('Failed to load Adsterra ad');
      
      adContainer.appendChild(configScript);
      adContainer.appendChild(adScript);
      containerRef.current.appendChild(adContainer);
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [atOptions]);

  return (
    <div className="my-4 flex justify-center overflow-hidden">
      <div 
        ref={containerRef} 
        className="w-full max-w-full"
        style={{ 
          maxHeight: atOptions.height || 90,
          maxWidth: atOptions.width || 728
        }}
      ></div>
    </div>
  );
}
