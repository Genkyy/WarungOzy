/**
 * Multi-Database FMCG API & Barcode Generator Service for Warung Ozy (KasirKu POS)
 * Queries 3 Global Public Databases:
 * 1. Open Food Facts (Makanan & Minuman)
 * 2. Open Beauty Facts (Sabun, Sampo, Lotion Anti Nyamuk seperti Autan, Pepsodent, Lifebuoy)
 * 3. Open Products Facts (Detergen, Pembersih, Baygon, Rinso, Sunlight)
 */

export interface OpenFoodFactsResult {
  success: boolean;
  barcode?: string;
  name?: string;
  imageUrl?: string;
  brand?: string;
  categories?: string;
  source?: string;
  error?: string;
}

export const openFoodFactsService = {
  /**
   * Generate a unique 13-digit EAN internal barcode for warung products (Prefix 200...)
   */
  generateInternalBarcode(): string {
    const prefix = '200';
    const randomNum = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const first12 = prefix + randomNum;

    // Calculate EAN-13 checksum digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(first12.charAt(i), 10);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return first12 + checkDigit;
  },

  /**
   * Helper to format image URLs safely
   */
  formatImageUrl(rawUrl?: string, domain = 'https://images.openfoodfacts.org'): string | undefined {
    if (!rawUrl) return undefined;
    let url = rawUrl.trim();
    if (url.startsWith('//')) {
      url = `https:${url}`;
    } else if (url.startsWith('/')) {
      url = `${domain}${url}`;
    }
    return url;
  },

  /**
   * Lookup product details and front photo by Barcode across 3 databases
   */
  async fetchByBarcode(barcode: string): Promise<OpenFoodFactsResult> {
    const cleanBarcode = barcode.trim().replace(/[^0-9]/g, '');
    if (!cleanBarcode) {
      return { success: false, error: 'Barcode tidak valid' };
    }

    const endpoints = [
      { name: 'Open Food Facts', url: `https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`, imgDomain: 'https://images.openfoodfacts.org' },
      { name: 'Open Beauty Facts', url: `https://world.openbeautyfacts.org/api/v0/product/${cleanBarcode}.json`, imgDomain: 'https://images.openbeautyfacts.org' },
      { name: 'Open Products Facts', url: `https://world.openproductsfacts.org/api/v0/product/${cleanBarcode}.json`, imgDomain: 'https://images.openproductsfacts.org' },
    ];

    for (const ep of endpoints) {
      try {
        const response = await fetch(ep.url);
        if (!response.ok) continue;

        const data = await response.json();
        if (data && data.status === 1 && data.product) {
          const p = data.product;
          const rawUrl = p.image_front_url || p.image_url || p.image_front_small_url || p.image_small_url;
          const formattedUrl = this.formatImageUrl(rawUrl, ep.imgDomain);
          const name = p.product_name_id || p.product_name || p.product_name_en || p.abbreviated_product_name;

          return {
            success: true,
            barcode: cleanBarcode,
            name: name ? name.trim() : undefined,
            imageUrl: formattedUrl,
            brand: p.brands ? p.brands.trim() : undefined,
            source: ep.name
          };
        }
      } catch (err) {
        console.warn(`Fetch error from ${ep.name}:`, err);
      }
    }

    return { success: false, error: 'Barcode tidak ditemukan di database publik (Food/Beauty/Products)' };
  },

  /**
   * Search Multi-Source Databases (Food + Beauty + Products) by Product Name Query
   */
  async searchByName(query: string): Promise<OpenFoodFactsResult[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const searchEndpoints = [
      { name: 'Open Food Facts', url: `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1`, imgDomain: 'https://images.openfoodfacts.org' },
      { name: 'Open Beauty Facts', url: `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1`, imgDomain: 'https://images.openbeautyfacts.org' },
      { name: 'Open Products Facts', url: `https://world.openproductsfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1`, imgDomain: 'https://images.openproductsfacts.org' },
    ];

    const resultsAcc: OpenFoodFactsResult[] = [];

    const searchPromises = searchEndpoints.map(async (ep) => {
      try {
        const response = await fetch(ep.url);
        if (!response.ok) return [];

        const data = await response.json();
        if (data && data.products && Array.isArray(data.products)) {
          return data.products.slice(0, 5).map((p: any) => {
            const rawUrl = p.image_front_url || p.image_url || p.image_small_url;
            const formattedUrl = this.formatImageUrl(rawUrl, ep.imgDomain);
            const name = p.product_name_id || p.product_name || p.product_name_en;

            return {
              success: true,
              barcode: p.code,
              name: name ? name.trim() : undefined,
              imageUrl: formattedUrl,
              brand: p.brands ? p.brands.trim() : undefined,
              source: ep.name
            };
          }).filter((item: any) => Boolean(item.barcode && item.name));
        }
      } catch (err) {
        console.warn(`Search error from ${ep.name}:`, err);
      }
      return [];
    });

    const searchResultsList = await Promise.all(searchPromises);
    searchResultsList.forEach(list => resultsAcc.push(...list));

    // Remove duplicates by barcode
    const uniqueMap = new Map<string, OpenFoodFactsResult>();
    resultsAcc.forEach(item => {
      if (item.barcode && !uniqueMap.has(item.barcode)) {
        uniqueMap.set(item.barcode, item);
      }
    });

    return Array.from(uniqueMap.values());
  },

  /**
   * Smart Photo Suggestion by Product Keywords (Unsplash FMCG Fallback)
   * Guaranteed to provide a high quality photo for local warung items
   */
  suggestPhotoByName(query: string): string {
    const q = query.toLowerCase();

    if (q.includes('es teh') || q.includes('teh obeng') || q.includes('teh manis')) {
      return 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80';
    }
    if (q.includes('kopi') || q.includes('kapal api') || q.includes('torabika') || q.includes('luwak')) {
      return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80';
    }
    if (q.includes('mie') || q.includes('indomie') || q.includes('sedaap') || q.includes('ramen')) {
      return 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80';
    }
    if (q.includes('minyak') || q.includes('sania') || q.includes('bimoli') || q.includes('tropical')) {
      return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80';
    }
    if (q.includes('beras') || q.includes('pandan') || q.includes('ramos')) {
      return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80';
    }
    if (q.includes('lotion') || q.includes('nyamuk') || q.includes('autan') || q.includes('soffell')) {
      return 'https://images.unsplash.com/photo-1608248597309-45de1787c70c?w=400&auto=format&fit=crop&q=80';
    }
    if (q.includes('sabun') || q.includes('lifebuoy') || q.includes('lux') || q.includes('biore') || q.includes('shampoo') || q.includes('sunsilk')) {
      return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80';
    }
    if (q.includes('air') || q.includes('aqua') || q.includes('minerale') || q.includes('cleo') || q.includes('nestle')) {
      return 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&auto=format&fit=crop&q=80';
    }
    if (q.includes('rokok') || q.includes('sampoerna') || q.includes('surya') || q.includes('gudang garam') || q.includes('marlboro')) {
      return 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&auto=format&fit=crop&q=80';
    }

    return 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&auto=format&fit=crop&q=80';
  }
};
