/**
 * Open Food Facts API Service for Warung Ozy (KasirKu POS)
 * Free API for looking up FMCG & Retail product photos and names by Barcode
 */

export interface OpenFoodFactsResult {
  success: boolean;
  name?: string;
  imageUrl?: string;
  brand?: string;
  categories?: string;
  error?: string;
}

export const openFoodFactsService = {
  /**
   * Lookup product details and front photo by Barcode
   */
  async fetchByBarcode(barcode: string): Promise<OpenFoodFactsResult> {
    const cleanBarcode = barcode.trim().replace(/[^0-9]/g, '');
    if (!cleanBarcode) {
      return { success: false, error: 'Barcode tidak valid' };
    }

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`);
      if (!response.ok) {
        return { success: false, error: `HTTP Error ${response.status}` };
      }

      const data = await response.json();

      if (data && data.status === 1 && data.product) {
        const p = data.product;

        let rawUrl = p.image_front_url ||
                     p.image_url ||
                     p.image_front_small_url ||
                     p.image_small_url ||
                     p.selected_images?.front?.display?.id ||
                     p.selected_images?.front?.display?.en ||
                     p.selected_images?.front?.display?.fr ||
                     p.selected_images?.front?.small?.id ||
                     p.selected_images?.front?.small?.en;

        if (rawUrl) {
          if (rawUrl.startsWith('//')) {
            rawUrl = `https:${rawUrl}`;
          } else if (rawUrl.startsWith('/')) {
            rawUrl = `https://images.openfoodfacts.org${rawUrl}`;
          }
        }

        const name = p.product_name_id || p.product_name || p.product_name_en || p.abbreviated_product_name;
        const brand = p.brands;
        const categories = p.categories;

        return {
          success: true,
          name: name ? name.trim() : undefined,
          imageUrl: rawUrl ? rawUrl.trim() : undefined,
          brand: brand ? brand.trim() : undefined,
          categories: categories ? categories.trim() : undefined
        };
      }

      return { success: false, error: 'Produk tidak ditemukan di database Open Food Facts' };
    } catch (err: any) {
      console.warn('Open Food Facts API error:', err);
      return { success: false, error: err.message || 'Gagal menghubungi Open Food Facts' };
    }
  }
};
