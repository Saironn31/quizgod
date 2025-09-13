// API Key obfuscation utility
export function decodeApiKey(encoded: string): string {
  // Simple Base64 decode with character shift
  const shifted = encoded.split('').map(char => 
    String.fromCharCode(char.charCodeAt(0) - 3)
  ).join('');
  return atob(shifted);
}

// Use this function to encode your API key:
// btoa("your_api_key").split('').map(char => String.fromCharCode(char.charCodeAt(0) + 3)).join('')