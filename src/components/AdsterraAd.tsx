"use client";
import { useEffect, useRef } from 'react';

interface AdsterraAdProps {
  atOptions: {
    key: string;
    format?: string;
    height?: number;
    width?: number;
    params?: Record<string, any>;
  };
}

declare global {
  interface Window {
    atAsyncOptions?: any[];
  }
}

export default function AdsterraAd({ atOptions }: AdsterraAdProps) {
  const banner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (banner.current && !banner.current.firstChild) {
      const conf = document.createElement('script');
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `//www.highperformanceformat.com/${atOptions.key}/invoke.js`;
      conf.innerHTML = `atOptions = ${JSON.stringify(atOptions)}`;

      banner.current.append(conf);
      banner.current.append(script);
    }
  }, [atOptions]);

  return <div className="mx-2 my-5 text-center" ref={banner}></div>;
}
