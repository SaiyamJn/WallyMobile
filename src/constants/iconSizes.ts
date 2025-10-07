// Icon size constants for consistent sizing across the app
export const ICON_SIZES = {
  // Basic size scale
  XS: 12,    // Extra small
  SM: 16,    // Small
  MD: 20,    // Medium (default)
  LG: 24,    // Large
  XL: 32,    // Extra large
  XXL: 48,   // Extra extra large
  
  // Navigation & UI
  NAVIGATION: 24,      // Bottom navigation icons
  BACK_BUTTON: 20,     // Back/close buttons
  FLOATING: 20,        // Floating action button
  
  // Dashboard
  DASHBOARD_BALANCE: 36,   // Main balance icon
  DASHBOARD_STAT: 24,      // Income/expense stat icons
  
  // Lists & Cards
  ACCOUNT: 20,         // Account list icons
  CATEGORY: 20,        // Category list icons
  TRANSACTION: 20,     // Transaction list icons
  
  // Forms & Modals
  FORM_ACCOUNT: 16,    // Account selection in forms
  FORM_CATEGORY: 20,   // Category selection in forms
  MODAL_ACCOUNT: 16,   // Account selection in modals
  MODAL_CATEGORY: 20,  // Category selection in modals
  
  // Actions & Buttons
  ACTION: 20,          // Action buttons (delete, etc.)
  ICON_SELECTION: 24,  // Icon selection grids
  
  // Special cases
  EMPTY_STATE: 48,     // Empty state illustrations
} as const;

export type IconSize = keyof typeof ICON_SIZES;
