const PAISE_PER_RUPEE = 100;
const LAST_GROUP_SIZE = 3;
const INDIAN_GROUP_SIZE = 2;

// Grouped by hand because Intl support varies across Android JS engines.
function groupIndian(rupees: string): string {
  if (rupees.length <= LAST_GROUP_SIZE) return rupees;

  const lastGroup = rupees.slice(-LAST_GROUP_SIZE);
  const groups: string[] = [];
  let end = rupees.length - LAST_GROUP_SIZE;
  while (end > 0) {
    groups.unshift(rupees.slice(Math.max(0, end - INDIAN_GROUP_SIZE), end));
    end -= INDIAN_GROUP_SIZE;
  }
  return `${groups.join(',')},${lastGroup}`;
}

export function formatINR(amountInPaise: number): string {
  if (!Number.isSafeInteger(amountInPaise)) {
    throw new RangeError('amountInPaise must be a safe integer');
  }

  const absolute = Math.abs(amountInPaise);
  const rupees = Math.floor(absolute / PAISE_PER_RUPEE);
  const paise = String(absolute % PAISE_PER_RUPEE).padStart(2, '0');
  const sign = amountInPaise < 0 ? '-' : '';
  return `${sign}₹${groupIndian(String(rupees))}.${paise}`;
}
