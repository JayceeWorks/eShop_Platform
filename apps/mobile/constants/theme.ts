// For native props that can't use Tailwind classes. Keep in sync with tailwind.config.js.
export const colors = {
  brand: '#0A1F4F',
  primary: '#1557E6',
  accent: '#F7A21B',
  white: '#FFFFFF',
  muted: '#6B7280',
  border: '#E5E7EB',
  brandTint: '#E7EEFC',
  surface: '#F3F6FB',
  success: '#15803D',
} as const;

// Matches the max-w-[480px] app container in app/_layout.tsx.
export const MAX_APP_WIDTH = 480;
export const TAB_BAR_HEIGHT = 60;
export const TAB_BAR_BOTTOM_PADDING = 6;

export const ICON_SIZE = { small: 18, medium: 24, large: 40, hero: 72 } as const;

type Gradient = {
  colors: readonly [string, string, ...string[]];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

// Navy stays behind header and card text, so white text keeps strong contrast.
// primary (blue) carries white text; action (orange) carries navy text.
export const GRADIENTS = {
  page: { colors: ['#EEF3FC', '#F3F6FB', '#F7F9FD'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  header: { colors: ['#0A1F4F', '#0E2A66', '#123A85'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  card: { colors: ['#0A1F4F', '#1446B8'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  primary: { colors: ['#2A6BF2', '#1557E6'], start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  action: { colors: ['#FFB83D', '#F7A21B'], start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
} as const satisfies Record<string, Gradient>;

export type GradientName = keyof typeof GRADIENTS;
