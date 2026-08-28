/**
 * Checks if a unit or category is a digital product type (Voucher / Top Up)
 * that does not have physical stock (unlimited / non-physical).
 */
export const isDigitalUnit = (unit?: string, categoryName?: string): boolean => {
  if (unit) {
    const u = unit.trim().toLowerCase();
    if (u === 'voucher' || u === 'top up' || u === 'topup') {
      return true;
    }
  }
  if (categoryName) {
    const c = categoryName.trim().toLowerCase();
    if (c.includes('top up') || c.includes('pulsa') || c.includes('voucher') || c.includes('digital')) {
      return true;
    }
  }
  return false;
};
