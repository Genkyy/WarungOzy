import { useEffect, useRef } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { repository } from '../services/indexedDBRepository';
import { audioBeep } from '../utils/audioBeep';

export function useBarcodeScanner() {
  const barcodeBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);
  const keyIntervals = useRef<number[]>([]);

  const addToCart = usePOSStore((state) => state.addToCart);
  const setActiveTab = usePOSStore((state) => state.setActiveTab);
  const showToast = usePOSStore((state) => state.showToast);
  const settings = usePOSStore((state) => state.settings);
  const setLastScannedBarcode = usePOSStore((state) => state.setLastScannedBarcode);
  const setScannerConnectionStatus = usePOSStore((state) => state.setScannerConnectionStatus);
  const setScannerDeviceName = usePOSStore((state) => state.setScannerDeviceName);

  useEffect(() => {
    const isEnabled = settings.enable_bluetooth_scanner !== 'false';
    const isSoundBeep = settings.scanner_beep_sound !== 'false';
    const maxDelay = parseInt(settings.scanner_max_delay || '80', 10);

    if (!isEnabled) {
      setScannerConnectionStatus('disconnected');
      return;
    }

    // Set initial connection status to connected/standby
    setScannerConnectionStatus('connected');

    // WebHID Event Listeners for device connection state (supported in Chrome/Edge)
    const handleHidConnect = (e: any) => {
      console.log('WebHID Device Connected:', e.device?.productName);
      setScannerConnectionStatus('connected');
      if (e.device?.productName) {
        setScannerDeviceName(e.device.productName);
      }
    };

    const handleHidDisconnect = (e: any) => {
      console.log('WebHID Device Disconnected:', e.device?.productName);
      setScannerConnectionStatus('standby');
    };

    if (navigator && 'hid' in navigator) {
      (navigator as any).hid.addEventListener('connect', handleHidConnect);
      (navigator as any).hid.addEventListener('disconnect', handleHidDisconnect);
    }

    const handleKeyDown = async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isBarcodeInput = target && target.getAttribute && target.getAttribute('data-barcode-input') === 'true';
      const isInputField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;
      lastKeyTime.current = currentTime;

      // Ignore normal manual human typing in generic input fields / textareas
      if (!isBarcodeInput && isInputField && timeDiff > maxDelay) {
        barcodeBuffer.current = '';
        return;
      }

      // Hardware Bluetooth / USB barcode scanners send characters rapidly (< 80ms)
      if (timeDiff > maxDelay && timeDiff < 3000) {
        barcodeBuffer.current = '';
        keyIntervals.current = [];
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length >= 3) {
          const barcode = barcodeBuffer.current.trim();
          barcodeBuffer.current = '';

          // Update connection status to active connected
          setScannerConnectionStatus('connected');

          // Calculate average scan speed (ms per char)
          const avgSpeedMs = keyIntervals.current.length > 0
            ? Math.round(keyIntervals.current.reduce((a, b) => a + b, 0) / keyIntervals.current.length)
            : 15;

          keyIntervals.current = [];
          e.preventDefault();

          try {
            const product = await repository.findProductByBarcode(barcode);
            if (product) {
              addToCart(product, 1);
              setActiveTab('pos');

              if (isSoundBeep) {
                audioBeep.playBeep('success');
              }

              showToast(`+1 ${product.name} dimasukkan ke Keranjang POS`, 'success');

              setLastScannedBarcode({
                barcode,
                timestamp: Date.now(),
                success: true,
                productName: product.name,
                scanSpeedMs: avgSpeedMs
              });
            } else {
              if (isSoundBeep) {
                audioBeep.playBeep('error');
              }

              showToast(`Produk dengan barcode '${barcode}' tidak ditemukan`, 'error');

              setLastScannedBarcode({
                barcode,
                timestamp: Date.now(),
                success: false,
                productName: undefined,
                scanSpeedMs: avgSpeedMs
              });
            }
          } catch (err) {
            console.error('Barcode scan error:', err);
          }
        }
        barcodeBuffer.current = '';
        keyIntervals.current = [];
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        if (timeDiff < 200) {
          keyIntervals.current.push(timeDiff);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (navigator && 'hid' in navigator) {
        (navigator as any).hid.removeEventListener('connect', handleHidConnect);
        (navigator as any).hid.removeEventListener('disconnect', handleHidDisconnect);
      }
    };
  }, [addToCart, showToast, settings, setLastScannedBarcode, setScannerConnectionStatus, setScannerDeviceName]);
}
