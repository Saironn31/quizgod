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
  const scriptAdded = useRef(false);

  useEffect(() => {
    if (containerRef.current && !scriptAdded.current && atOptions.key) {
      // Create the config script
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.innerHTML = `
        atOptions = ${JSON.stringify(atOptions)};
      `;
      
      // Create the ad script
      const adScript = document.createElement('script');
      adScript.type = 'text/javascript';
      adScript.src = `//www.topcreativeformat.com/${atOptions.key}/invoke.js`;
      adScript.async = true;
      
      containerRef.current.appendChild(configScript);
      containerRef.current.appendChild(adScript);
      scriptAdded.current = true;
    }
  }, [atOptions]);

  return (
    <div className="my-4 flex justify-center">
      <div ref={containerRef}></div>
    </div>
  );
}
