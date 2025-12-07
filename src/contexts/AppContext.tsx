import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Transaction, Category, Currency, Screen, Account } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultCategoryIcons } from '../utils/iconUtils';

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  currentCurrency: Currency;
  currentScreen: Screen;
  navigationHistory: Screen[];
  selectedAccountId: string | null;
  selectedTransactionId: string | null;
  selectedCategory: string | null;
  categoryTransactions: Transaction[];
}

type AppAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'RESET_CATEGORIES' }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'UPDATE_ACCOUNT_BALANCE'; payload: { accountId: string; amount: number } }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'SET_SCREEN'; payload: Screen }
  | { type: 'SET_SCREEN_WITH_ACCOUNT'; payload: { screen: Screen; accountId: string | null } }
  | { type: 'SET_SCREEN_WITH_TRANSACTION'; payload: { screen: Screen; transactionId: string | null } }
  | { type: 'SET_SCREEN_WITH_CATEGORY'; payload: { screen: Screen; categoryName: string; transactions: Transaction[] } }
  | { type: 'SET_SELECTED_ACCOUNT'; payload: string | null }
  | { type: 'SET_SELECTED_TRANSACTION'; payload: string | null }
  | { type: 'SET_SELECTED_CATEGORY'; payload: string | null }
  | { type: 'GO_BACK' }
  | { type: 'LOAD_DATA'; payload: Partial<AppState> }
  | { type: 'CLEAR_ALL_DATA' };

const currencies: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.85 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.73 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 110 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.25 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.35 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rate: 0.92 },
];

const defaultCategories: Category[] = [
  { id: '1', name: 'Food & Dining', type: 'expense', icon: defaultCategoryIcons['Food & Dining'], color: '#ef4444' },
  { id: '2', name: 'Transportation', type: 'expense', icon: defaultCategoryIcons['Transportation'], color: '#3b82f6' },
  { id: '3', name: 'Shopping', type: 'expense', icon: defaultCategoryIcons['Shopping'], color: '#8b5cf6' },
  { id: '4', name: 'Entertainment', type: 'expense', icon: defaultCategoryIcons['Entertainment'], color: '#f59e0b' },
  { id: '5', name: 'Bills & Utilities', type: 'expense', icon: defaultCategoryIcons['Bills & Utilities'], color: '#10b981' },
  { id: '6', name: 'Healthcare', type: 'expense', icon: defaultCategoryIcons['Healthcare'], color: '#ec4899' },
  { id: '7', name: 'Salary', type: 'income', icon: defaultCategoryIcons['Salary'], color: '#059669' },
  { id: '8', name: 'Freelance', type: 'income', icon: defaultCategoryIcons['Freelance'], color: '#0ea5e9' },
  { id: '9', name: 'Investment', type: 'income', icon: defaultCategoryIcons['Investment'], color: '#8b5cf6' },
  { id: '10', name: 'Other Income', type: 'income', icon: defaultCategoryIcons['Other Income'], color: '#f59e0b' },
];

const defaultAccounts: Account[] = [
  {
    id: '1',
    name: 'Main Account',
    type: 'other',
    description: 'Primary account for daily expenses',
    icon: 'card',
    color: '#3b82f6',
    balance: 0,
    currency: 'INR',
    createdAt: new Date().toISOString()
  }
];

// Storage keys
const STORAGE_KEYS = {
  TRANSACTIONS: 'wally_transactions',
  CATEGORIES: 'wally_categories',
  ACCOUNTS: 'wally_accounts',
  CURRENCY: 'wally_currency',
  SCREEN: 'wally_screen',
  NAVIGATION: 'wally_navigation',
  DATA_VERSION: 'wally_data_version'
};

// Data version for migration support
const CURRENT_DATA_VERSION = '1.0.0';

// Storage functions
const saveToStorage = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

const loadFromStorage = async (key: string, defaultValue: any) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Error loading from storage:', error);
    return defaultValue;
  }
};

const clearAllStorage = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.ACCOUNTS,
      STORAGE_KEYS.CURRENCY,
      STORAGE_KEYS.SCREEN,
      STORAGE_KEYS.NAVIGATION
    ]);
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

const initialState: AppState = {
  transactions: [],
  categories: defaultCategories,
  accounts: [],
  currentCurrency: currencies.find(c => c.code === 'INR') || currencies[0],
  currentScreen: 'dashboard',
  navigationHistory: ['dashboard'],
  selectedAccountId: null,
  selectedTransactionId: null,
  selectedCategory: null,
  categoryTransactions: []
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [...state.transactions, action.payload]
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t => 
          t.id === action.payload.id ? action.payload : t
        )
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload)
      };
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload]
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload)
      };
    case 'RESET_CATEGORIES':
      // Get custom categories that have transactions (not default categories)
      const customCategoriesWithTransactions = state.categories.filter(category => {
        const isCustomCategory = !defaultCategories.some(defaultCat => defaultCat.name === category.name);
        const hasTransactions = state.transactions.some(transaction => transaction.category === category.name);
        return isCustomCategory && hasTransactions;
      });
      
      // Always restore all default categories
      const resetCategories = [...defaultCategories, ...customCategoriesWithTransactions];
      
      return {
        ...state,
        categories: resetCategories
      };
    case 'ADD_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts, action.payload]
      };
    case 'DELETE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.filter(a => a.id !== action.payload)
      };
    case 'UPDATE_ACCOUNT_BALANCE':
      return {
        ...state,
        accounts: state.accounts.map(account => 
          account.id === action.payload.accountId 
            ? { ...account, balance: account.balance + action.payload.amount }
            : account
        )
      };
    case 'SET_CURRENCY':
      return {
        ...state,
        currentCurrency: action.payload
      };
    case 'SET_SCREEN':
      // Don't add to history if it's the same screen
      if (state.currentScreen === action.payload) {
        return state;
      }
      return {
        ...state,
        currentScreen: action.payload,
        navigationHistory: [...state.navigationHistory, action.payload]
      };
    case 'SET_SCREEN_WITH_ACCOUNT':
      // Don't add to history if it's the same screen
      if (state.currentScreen === action.payload.screen) {
        return {
          ...state,
          selectedAccountId: action.payload.accountId
        };
      }
      return {
        ...state,
        currentScreen: action.payload.screen,
        selectedAccountId: action.payload.accountId,
        navigationHistory: [...state.navigationHistory, action.payload.screen]
      };
    case 'SET_SELECTED_ACCOUNT':
      return {
        ...state,
        selectedAccountId: action.payload
      };
    case 'SET_SELECTED_TRANSACTION':
      return {
        ...state,
        selectedTransactionId: action.payload
      };
    case 'SET_SCREEN_WITH_TRANSACTION':
      return {
        ...state,
        currentScreen: action.payload.screen,
        selectedTransactionId: action.payload.transactionId,
        navigationHistory: [...state.navigationHistory, action.payload.screen]
      };
    case 'SET_SCREEN_WITH_CATEGORY':
      return {
        ...state,
        currentScreen: action.payload.screen,
        selectedCategory: action.payload.categoryName,
        categoryTransactions: action.payload.transactions,
        navigationHistory: [...state.navigationHistory, action.payload.screen]
      };
    case 'SET_SELECTED_CATEGORY':
      return {
        ...state,
        selectedCategory: action.payload
      };
    case 'GO_BACK':
      if (state.navigationHistory.length > 1) {
        const newHistory = [...state.navigationHistory];
        newHistory.pop(); // Remove current screen
        const previousScreen = newHistory[newHistory.length - 1];
        return {
          ...state,
          currentScreen: previousScreen,
          navigationHistory: newHistory
        };
      }
      // If no history, go to dashboard
      return {
        ...state,
        currentScreen: 'dashboard',
        navigationHistory: ['dashboard']
      };
    case 'LOAD_DATA':
      return {
        ...state,
        ...action.payload
      };
    case 'CLEAR_ALL_DATA':
      // Clear storage asynchronously
      clearAllStorage();
      return {
        ...initialState,
        currentScreen: 'dashboard',
        navigationHistory: ['dashboard'],
        selectedAccountId: null,
        selectedTransactionId: null,
        selectedCategory: null,
        categoryTransactions: []
      };
    default:
      return state;
  }
}

// Backup data interface
export interface BackupData {
  version: string;
  timestamp: string;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  currentCurrency: Currency;
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  currencies: Currency[];
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
  formatCurrency: (amount: number, currency?: Currency) => string;
  exportData: () => Promise<string>;
  importData: (backupJson: string) => Promise<{ success: boolean; message: string }>;
} | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load data from storage on app start
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if this is a fresh installation by looking for any existing data
        const hasExistingData = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        
        if (hasExistingData) {
          // Load existing data from storage
          const [transactions, categories, accounts, currency, dataVersion] = await Promise.all([
            loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []),
            loadFromStorage(STORAGE_KEYS.CATEGORIES, defaultCategories),
            loadFromStorage(STORAGE_KEYS.ACCOUNTS, []),
            loadFromStorage(STORAGE_KEYS.CURRENCY, initialState.currentCurrency),
            loadFromStorage(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION)
          ]);

          // Future: Add migration logic here if dataVersion !== CURRENT_DATA_VERSION
          if (dataVersion !== CURRENT_DATA_VERSION) {
            // Migration logic can be added here in the future
          }

          // Ensure data integrity - validate and fix if needed
          const validTransactions = Array.isArray(transactions) ? transactions : [];
          const validCategories = Array.isArray(categories) && categories.length > 0 ? categories : defaultCategories;
          const validAccounts = Array.isArray(accounts) ? accounts : [];
          const validCurrency = currency && typeof currency === 'object' && currency.code ? currency : initialState.currentCurrency;

          dispatch({ type: 'LOAD_DATA', payload: {
            transactions: validTransactions,
            categories: validCategories,
            accounts: validAccounts,
            currentCurrency: validCurrency,
            currentScreen: 'dashboard',
            navigationHistory: ['dashboard']
          }});
        } else {
          // Fresh installation - start with empty data
          dispatch({ type: 'LOAD_DATA', payload: {
            transactions: [],
            categories: defaultCategories,
            accounts: [],
            currentCurrency: initialState.currentCurrency,
            currentScreen: 'dashboard',
            navigationHistory: ['dashboard']
          }});
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
        // On error, start with clean state
        dispatch({ type: 'LOAD_DATA', payload: {
          transactions: [],
          categories: defaultCategories,
          accounts: [],
          currentCurrency: initialState.currentCurrency,
          currentScreen: 'dashboard',
          navigationHistory: ['dashboard']
        }});
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  // Save data to storage whenever state changes
  useEffect(() => {
    if (isLoaded) {
      const saveData = async () => {
        await Promise.all([
          saveToStorage(STORAGE_KEYS.TRANSACTIONS, state.transactions),
          saveToStorage(STORAGE_KEYS.CATEGORIES, state.categories),
          saveToStorage(STORAGE_KEYS.ACCOUNTS, state.accounts),
          saveToStorage(STORAGE_KEYS.CURRENCY, state.currentCurrency),
          saveToStorage(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION)
          // Don't save screen and navigation - always start on dashboard
        ]);
      };
      saveData();
    }
  }, [state, isLoaded]);

  // Export data as JSON string
  const exportData = async (): Promise<string> => {
    const backupData: BackupData = {
      version: CURRENT_DATA_VERSION,
      timestamp: new Date().toISOString(),
      transactions: state.transactions,
      categories: state.categories,
      accounts: state.accounts,
      currentCurrency: state.currentCurrency
    };
    return JSON.stringify(backupData, null, 2);
  };

  // Validate backup data structure
  const validateBackupData = (data: any): { valid: boolean; message: string } => {
    // Check if data is an object
    if (!data || typeof data !== 'object') {
      return { valid: false, message: 'Invalid backup file: Not a valid JSON object' };
    }

    // Check for required top-level fields
    if (!data.version || typeof data.version !== 'string') {
      return { valid: false, message: 'Invalid backup file: Missing or invalid version field' };
    }

    if (!data.timestamp || typeof data.timestamp !== 'string') {
      return { valid: false, message: 'Invalid backup file: Missing or invalid timestamp field' };
    }

    // Check if arrays exist and are arrays
    if (!Array.isArray(data.transactions)) {
      return { valid: false, message: 'Invalid backup file: Missing or invalid transactions array' };
    }

    if (!Array.isArray(data.categories)) {
      return { valid: false, message: 'Invalid backup file: Missing or invalid categories array' };
    }

    if (!Array.isArray(data.accounts)) {
      return { valid: false, message: 'Invalid backup file: Missing or invalid accounts array' };
    }

    // Check if currentCurrency exists and has required fields
    if (!data.currentCurrency || typeof data.currentCurrency !== 'object') {
      return { valid: false, message: 'Invalid backup file: Missing or invalid currentCurrency object' };
    }

    if (!data.currentCurrency.code || !data.currentCurrency.symbol || !data.currentCurrency.name) {
      return { valid: false, message: 'Invalid backup file: Invalid currency format' };
    }

    // Validate transaction structure (only if transactions exist)
    if (data.transactions.length > 0) {
      for (const transaction of data.transactions) {
        if (!transaction.id || !transaction.type || !transaction.amount || !transaction.date || !transaction.category) {
          return { valid: false, message: 'Invalid backup file: Transactions have invalid structure' };
        }
        if (transaction.type !== 'income' && transaction.type !== 'expense') {
          return { valid: false, message: 'Invalid backup file: Invalid transaction type' };
        }
        if (typeof transaction.amount !== 'number' || isNaN(transaction.amount)) {
          return { valid: false, message: 'Invalid backup file: Transaction amount must be a valid number' };
        }
      }
    }

    // Validate category structure (only if categories exist)
    if (data.categories.length > 0) {
      for (const category of data.categories) {
        if (!category.id || !category.name || !category.type || !category.icon || !category.color) {
          return { valid: false, message: 'Invalid backup file: Categories have invalid structure' };
        }
        if (category.type !== 'income' && category.type !== 'expense') {
          return { valid: false, message: 'Invalid backup file: Invalid category type' };
        }
      }
    }

    // Validate account structure (only if accounts exist)
    if (data.accounts.length > 0) {
      for (const account of data.accounts) {
        if (!account.id || !account.name || !account.type || !account.icon || !account.color) {
          return { valid: false, message: 'Invalid backup file: Accounts have invalid structure' };
        }
        if (account.type !== 'bank' && account.type !== 'cash' && account.type !== 'credit' && account.type !== 'investment') {
          return { valid: false, message: 'Invalid backup file: Invalid account type' };
        }
      }
    }

    return { valid: true, message: '' };
  };

  // Import data from JSON string
  const importData = async (backupJson: string): Promise<{ success: boolean; message: string }> => {
    try {
      // First, try to parse JSON
      let backupData: BackupData;
      try {
        backupData = JSON.parse(backupJson);
      } catch (parseError) {
        return { success: false, message: 'Invalid backup file: Not a valid JSON file. Please ensure you are importing a Wally backup file.' };
      }

      // Validate backup data structure
      const validation = validateBackupData(backupData);
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      // Check version compatibility (for future migrations)
      if (backupData.version !== CURRENT_DATA_VERSION) {
        // For now, we'll still allow import but could add migration logic here
        console.warn(`Backup version ${backupData.version} differs from current ${CURRENT_DATA_VERSION}`);
      }

      // Import the data
      dispatch({ type: 'LOAD_DATA', payload: {
        transactions: backupData.transactions || [],
        categories: backupData.categories || defaultCategories,
        accounts: backupData.accounts || [],
        currentCurrency: backupData.currentCurrency || initialState.currentCurrency,
        currentScreen: 'dashboard',
        navigationHistory: ['dashboard']
      }});

      // Save to storage
      await Promise.all([
        saveToStorage(STORAGE_KEYS.TRANSACTIONS, backupData.transactions || []),
        saveToStorage(STORAGE_KEYS.CATEGORIES, backupData.categories || defaultCategories),
        saveToStorage(STORAGE_KEYS.ACCOUNTS, backupData.accounts || []),
        saveToStorage(STORAGE_KEYS.CURRENCY, backupData.currentCurrency || initialState.currentCurrency),
        saveToStorage(STORAGE_KEYS.DATA_VERSION, backupData.version || CURRENT_DATA_VERSION)
      ]);

      return { success: true, message: 'Data imported successfully' };
    } catch (error) {
      console.error('Error importing data:', error);
      return { success: false, message: 'Failed to import data. Please check the backup file format.' };
    }
  };

  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string) => {
    const fromRate = currencies.find(c => c.code === fromCurrency)?.rate || 1;
    const toRate = currencies.find(c => c.code === toCurrency)?.rate || 1;
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  };

  const formatCurrency = (amount: number, currency = state.currentCurrency) => {
    return `${currency.symbol}${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Show loading state while data is being loaded
  // Return a minimal provider with default state to prevent crashes
  if (!isLoaded) {
    return (
      <AppContext.Provider value={{
        state: initialState,
        dispatch: () => {}, // No-op dispatch during loading
        currencies,
        convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => {
          const fromRate = currencies.find(c => c.code === fromCurrency)?.rate || 1;
          const toRate = currencies.find(c => c.code === toCurrency)?.rate || 1;
          const usdAmount = amount / fromRate;
          return usdAmount * toRate;
        },
        formatCurrency: (amount: number, currency = initialState.currentCurrency) => {
          return `${currency.symbol}${amount.toLocaleString('en-US', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 2 
          })}`;
        },
        exportData: async () => JSON.stringify({ version: CURRENT_DATA_VERSION, timestamp: new Date().toISOString(), transactions: [], categories: [], accounts: [], currentCurrency: initialState.currentCurrency }),
        importData: async () => ({ success: false, message: 'App is still loading' })
      }}>
        {children}
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      currencies,
      convertAmount,
      formatCurrency,
      exportData,
      importData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}