import { useEffect, useRef } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { repository } from '../services/indexedDBRepository';

export function useBarcodeScanner() {
  const barcodeBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);
  const addToCart = usePOSStore((state) => state.addToCart);
  const showToast = usePOSStore((state) => state.showToast);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore key events when user is typing in form inputs/textareas
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;
      lastKeyTime.current = currentTime;

      // Hardware barcode scanners send characters rapidly (< 50ms)
      if (timeDiff > 100) {
        barcodeBuffer.current = '';
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length >= 3) {
          const barcode = barcodeBuffer.current.trim();
          barcodeBuffer.current = '';
          e.preventDefault();

          try {
            const product = await repository.findProductByBarcode(barcode);
            if (product) {
              addToCart(product, 1);
              showToast(`Barcode Scanned: ${product.name}`, 'success');
            } else {
              showToast(`Produk dengan barcode '${barcode}' tidak ditemukan`, 'error');
            }
          } catch (err) {
            console.error('Barcode scan error:', err);
          }
        }
        barcodeBuffer.current = '';
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [addToCart, showToast]);
}
