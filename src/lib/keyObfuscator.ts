// Security utility for API key obfuscation
export class KeyObfuscator {
  private static readonly OFFSET = 7;
  
  // XOR encryption with offset
  private static xorEncode(str: string): string {
    return str
      .split('')
      .map(char => String.fromCharCode(char.charCodeAt(0) ^ this.OFFSET))
      .join('');
  }
  
  // Reverse XOR to decode
  private static xorDecode(encoded: string): string {
    return encoded
      .split('')
      .map(char => String.fromCharCode(char.charCodeAt(0) ^ this.OFFSET))
      .join('');
  }
  
  // Base64 + XOR combo
  public static encode(key: string): string {
    const xored = this.xorEncode(key);
    return btoa(xored);
  }
  
  public static decode(encoded: string): string {
    const decoded = atob(encoded);
    return this.xorDecode(decoded);
  }
  
  // Split and reassemble (makes it harder to spot)
  public static splitKey(key: string): string[] {
    const parts = [
      key.substring(0, 10),
      key.substring(10, 20),
      key.substring(20, 30),
      key.substring(30)
    ];
    return parts.map(part => this.encode(part));
  }
  
  public static reassembleKey(parts: string[]): string {
    return parts.map(part => this.decode(part)).join('');
  }
}