/**
 * Formats a number or numeric string to IDR format e.g. 1000 -> "Rp 1.000" or "1.000"
 */
export const formatRupiah = (val: number | string, includePrefix = true): string => {
  if (val === null || val === undefined || val === '') return includePrefix ? 'Rp 0' : '0';
  const numStr = typeof val === 'number' ? Math.round(val).toString() : val.toString().replace(/\D/g, '');
  if (!numStr) return includePrefix ? 'Rp 0' : '0';
  
  const formatted = parseInt(numStr, 10).toLocaleString('id-ID');
  return includePrefix ? `Rp ${formatted}` : formatted;
};

/**
 * Parses a Rupiah string like "1.000" or "Rp 1.500.000" into raw integer number
 */
export const parseRupiah = (val: string): number => {
  if (!val) return 0;
  const numStr = val.replace(/\D/g, '');
  return parseInt(numStr, 10) || 0;
};
