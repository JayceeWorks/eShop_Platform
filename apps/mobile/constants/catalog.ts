import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { strings } from '@/lib/i18n';

export type IconName = ComponentProps<typeof Ionicons>['name'];

const PAISE_PER_RUPEE = 100;
const rupees = (amount: number) => amount * PAISE_PER_RUPEE;

export const SEARCH_DEBOUNCE_MS = 350;
export const CATALOG_STALE_TIME_MS = 5 * 60 * 1000;
export const HOME_SECTION_LIMIT = 6;
export const BROWSE_PAGE_LIMIT = 20;

export const DEFAULT_CATEGORY_ICON: IconName = 'videocam-outline';

export const CATEGORY_ICONS: Record<string, IconName> = {
  'home-surveillance': 'home-outline',
  'building-surveillance': 'business-outline',
  'land-site-surveillance': 'leaf-outline',
  'supporting-devices': 'hardware-chip-outline',
  'dvr-nvr': 'server-outline',
  'hard-disks': 'save-outline',
  'cables-connectors': 'git-network-outline',
  'power-supplies': 'flash-outline',
  mounts: 'construct-outline',
  'smart-home': 'bulb-outline',
  'smart-locks': 'lock-closed-outline',
  'video-door-phones': 'tablet-portrait-outline',
  'sensors-alarms': 'notifications-outline',
  'smart-plugs-lighting': 'bulb-outline',
};

// Products in these categories are cameras, so their placeholder art shows a camera.
export const CAMERA_CATEGORY_SLUGS = [
  'home-surveillance',
  'building-surveillance',
  'land-site-surveillance',
];

export type PriceRange = {
  id: string;
  label: string;
  minPriceInPaise?: number;
  maxPriceInPaise?: number;
};

export const PRICE_RANGES: PriceRange[] = [
  { id: 'under2k', label: strings.filters.priceRanges.under2k, maxPriceInPaise: rupees(2000) },
  {
    id: 'from2kTo5k',
    label: strings.filters.priceRanges.from2kTo5k,
    minPriceInPaise: rupees(2000),
    maxPriceInPaise: rupees(5000),
  },
  {
    id: 'from5kTo10k',
    label: strings.filters.priceRanges.from5kTo10k,
    minPriceInPaise: rupees(5000),
    maxPriceInPaise: rupees(10000),
  },
  { id: 'over10k', label: strings.filters.priceRanges.over10k, minPriceInPaise: rupees(10000) },
];
