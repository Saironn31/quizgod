/**
 * Get user's country from IP address without requiring location permission
 * Uses multiple free geolocation APIs as fallbacks
 */

interface LocationData {
  country: string;
  countryCode: string;
  city?: string;
  region?: string;
}

export async function getCountryFromIP(): Promise<LocationData | null> {
  // Try multiple services in order
  const services = [
    // ipapi.co - Free, no API key needed, 1000 requests/day
    async () => {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      return {
        country: data.country_name,
        countryCode: data.country_code,
        city: data.city,
        region: data.region
      };
    },
    
    // ip-api.com - Free, no API key needed, 45 requests/minute
    async () => {
      const res = await fetch('http://ip-api.com/json/');
      const data = await res.json();
      return {
        country: data.country,
        countryCode: data.countryCode,
        city: data.city,
        region: data.regionName
      };
    },
    
    // ipinfo.io - Free, no API key needed, 50k requests/month
    async () => {
      const res = await fetch('https://ipinfo.io/json');
      const data = await res.json();
      return {
        country: data.country, // Returns country code only
        countryCode: data.country,
        city: data.city,
        region: data.region
      };
    }
  ];

  // Try each service until one works
  for (const service of services) {
    try {
      const data = await service();
      if (data && data.country) {
        return data;
      }
    } catch (error) {
      console.warn('Geolocation service failed, trying next...', error);
      continue;
    }
  }

  // Fallback: Try to detect from browser language
  if (typeof navigator !== 'undefined' && navigator.language) {
    const langCode = navigator.language.split('-')[1]?.toUpperCase();
    if (langCode) {
      return {
        country: langCode,
        countryCode: langCode
      };
    }
  }

  return null;
}

/**
 * Check if user is in EU/EEA for GDPR compliance
 */
export function isEUCountry(countryCode: string): boolean {
  const euCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'CH'
  ];
  return euCountries.includes(countryCode.toUpperCase());
}

/**
 * Get country-appropriate currency symbol
 */
export function getCurrencyForCountry(countryCode: string): { currency: string; symbol: string } {
  const currencyMap: Record<string, { currency: string; symbol: string }> = {
    'US': { currency: 'USD', symbol: '$' },
    'GB': { currency: 'GBP', symbol: '£' },
    'EU': { currency: 'EUR', symbol: '€' },
    'CA': { currency: 'CAD', symbol: 'CA$' },
    'AU': { currency: 'AUD', symbol: 'A$' },
    'JP': { currency: 'JPY', symbol: '¥' },
    'IN': { currency: 'INR', symbol: '₹' },
  };

  // Check if EU country
  if (isEUCountry(countryCode)) {
    return currencyMap['EU'];
  }

  return currencyMap[countryCode] || currencyMap['US'];
}
