// CORS Proxy service for streaming platforms
export class CorsProxy {
  private static proxyUrls = [
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-proxy.fringe.zone/',
  ];

  private static sonyLivProxies = [
    'https://proxy.cors.sh/',
    'https://api.codetabs.com/v1/proxy?quest=',
  ];

  static getSonyLivUrl(originalUrl: string): string[] {
    return [
      // Direct Sony Liv URLs (try first)
      originalUrl.replace('https://dai.google.com', 'https://sony-liv-proxy.vercel.app/proxy'),
      // Proxy alternatives
      ...this.sonyLivProxies.map(proxy => `${proxy}${encodeURIComponent(originalUrl)}`),
      // Generic proxies as fallback
      ...this.proxyUrls.map(proxy => `${proxy}${encodeURIComponent(originalUrl)}`),
    ];
  }

  static getProxiedUrls(originalUrl: string): string[] {
    // If it's a Sony/FanCode stream, use specialized proxies
    if (originalUrl.includes('sonyliv.com') || originalUrl.includes('dai.google.com')) {
      return this.getSonyLivUrl(originalUrl);
    }

    // For other streams, use generic proxies
    return [
      originalUrl, // Try direct first
      ...this.proxyUrls.map(proxy => `${proxy}${encodeURIComponent(originalUrl)}`),
    ];
  }

  static async testUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors',
      });
      return true;
    } catch {
      return false;
    }
  }
}