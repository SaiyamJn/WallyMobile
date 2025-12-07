// Icon utility functions for managing asset-based icons
import { ImageSourcePropType } from 'react-native';

// Emoji fallback mapping
const emojiFallbacks: Record<string, string> = {
  // Account icons
  'plane': '✈️',
  'card': '💳',
  'chart': '📊',
  'popcorn': '🍿',
  'bank': '🏦',
  'diamond': '💎',
  'target': '🎯',
  'rocket': '🚀',
  'star': '⭐',
  'lock': '🔒',
  'briefcase': '💼',
  'home': '🏠',
  'game': '🎮',
  'book': '📚',
  'palette': '🎨',
  'music': '🎵',
  
  // Category icons
  'food': '🍴',
  'car': '🚗',
  'shopping': '🛒',
  'movie': '🎬',
  'lightning': '⚡',
  'hospital': '🏥',
  'laptop': '💻',
  'pizza': '🍕',
  'coffee': '☕',
  
  // Navigation icons
  'dashboard': '🏠',
  'transactions': '📋',
  'accounts': '💳',
  'reports': '📊',
  'settings': '⚙️',
  
  // Dashboard icons
  'wallet': '💰',
  'balance': '💳',
  'total_balance': '🏦',
  'income_arrow': '↗️',
  'expense_arrow': '↘️',
  
  // Action icons
  'delete': '🗑️',
  'add': '➕',
  'edit': '✏️',
  'save': '💾',
  'cancel': '❌',
  'back': '←',
  'forward': '→',
  'up': '↑',
  'down': '↓',
  
  // Status icons
  'success': '✅',
  'error': '❌',
  'warning': '⚠️',
  'info': 'ℹ️',
  'loading': '⏳',
  
  // Default icons
  'default': '❓',
};

// Define available icons with their asset paths (with fallback handling)
export const iconAssets = {
  // Account icons
  'plane': require('../../assets/icons/plane.png'),
  'card': require('../../assets/icons/card.png'),
  'chart': require('../../assets/icons/chart.png'),
  'popcorn': require('../../assets/icons/popcorn.png'),
  'bank': require('../../assets/icons/bank.png'),
  'diamond': require('../../assets/icons/diamond.png'),
  'target': require('../../assets/icons/target.png'),
  'rocket': require('../../assets/icons/rocket.png'),
  'star': require('../../assets/icons/star.png'),
  'lock': require('../../assets/icons/lock.png'),
  'briefcase': require('../../assets/icons/briefcase.png'),
  'home': require('../../assets/icons/home.png'),
  'game': require('../../assets/icons/game.png'),
  'book': require('../../assets/icons/book.png'),
  'palette': require('../../assets/icons/palette.png'),
  'music': require('../../assets/icons/music.png'),
  
  // Category icons
  'food': require('../../assets/icons/food.png'),
  'car': require('../../assets/icons/car.png'),
  'shopping': require('../../assets/icons/shopping.png'),
  'movie': require('../../assets/icons/movie.png'),
  'lightning': require('../../assets/icons/lightning.png'),
  'hospital': require('../../assets/icons/hospital.png'),
  'laptop': require('../../assets/icons/laptop.png'),
  'pizza': require('../../assets/icons/pizza.png'),
  'coffee': require('../../assets/icons/coffee.png'),
  
  // Navigation icons
  'dashboard': require('../../assets/icons/dashboard.png'),
  'transactions': require('../../assets/icons/transactions.png'),
  'accounts': require('../../assets/icons/accounts.png'),
  'reports': require('../../assets/icons/reports.png'),
  'settings': require('../../assets/icons/settings.png'),
  
  // Dashboard icons
  'wallet': require('../../assets/wallet.png'), // Using existing wallet icon
  'balance': require('../../assets/icons/balance.png'),
  'total_balance': require('../../assets/icons/total_balance.png'),
  'income_arrow': require('../../assets/icons/income_arrow.png'),
  'expense_arrow': require('../../assets/icons/expense_arrow.png'),
  
  // Action icons
  'delete': require('../../assets/icons/delete.png'),
  'add': require('../../assets/icons/add.png'),
  'edit': require('../../assets/icons/edit.png'),
  'save': require('../../assets/icons/save.png'),
  'cancel': require('../../assets/icons/cancel.png'),
  'back': require('../../assets/icons/back.png'),
  'forward': require('../../assets/icons/forward.png'),
  'up': require('../../assets/icons/up.png'),
  'down': require('../../assets/icons/down.png'),
  
  // Status icons
  'success': require('../../assets/icons/success.png'),
  'error': require('../../assets/icons/error.png'),
  'warning': require('../../assets/icons/warning.png'),
  'info': require('../../assets/icons/info.png'),
  'loading': require('../../assets/icons/loading.png'),
  
  // Default icons
  'default': require('../../assets/icons/default.png'),
} as const;

export type IconName = keyof typeof iconAssets;

// Get icon source by name
export const getIconSource = (iconName: IconName): ImageSourcePropType => {
  try {
    return iconAssets[iconName];
  } catch (error) {
    console.warn(`Failed to get icon source for ${iconName}:`, error);
    // Return a default icon if the requested one fails
    return iconAssets['default'] || iconAssets['card'];
  }
};

// Get emoji fallback for icon name
export const getEmojiFallback = (iconName: string): string => {
  return emojiFallbacks[iconName] || '❓';
};

// Check if icon exists
export const hasIcon = (iconName: string): iconName is IconName => {
  return iconName in iconAssets;
};

// Check if we should use asset or emoji (now using custom PNG assets!)
export const shouldUseAsset = (iconName: string): boolean => {
  // Return true to use custom PNG assets instead of emoji fallbacks
  return true;
};

// Account icon options
export const accountIconOptions: IconName[] = [
  'plane', 'card', 'chart', 'popcorn', 'bank', 'diamond', 
  'target', 'rocket', 'star', 'lock', 'briefcase', 'home', 
  'game', 'book', 'palette', 'music'
];

// Category icon options
export const categoryIconOptions: IconName[] = [
  'card', 'food', 'car', 'shopping', 'movie', 'lightning', 
  'hospital', 'briefcase', 'laptop', 'chart', 'home', 'game', 
  'book', 'plane', 'pizza', 'coffee'
];


// Default category icons mapping
export const defaultCategoryIcons: Record<string, IconName> = {
  'Food & Dining': 'food',
  'Transportation': 'car',
  'Shopping': 'shopping',
  'Entertainment': 'movie',
  'Bills & Utilities': 'lightning',
  'Healthcare': 'hospital',
  'Salary': 'briefcase',
  'Freelance': 'laptop',
  'Investment': 'chart',
  'Other Income': 'card',
};
