import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { Transaction, Category, Currency, Screen, Account, Person, ExpenseGroup, Expense, Settlement } from '../types';
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
  // Divido state
  people: Person[];
  expenseGroups: ExpenseGroup[];
  expenses: Expense[];
  settlements: Settlement[];
  selectedExpenseGroupId: string | null;
  selectedExpenseId: string | null;
  selectedPersonId: string | null;
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
  | { type: 'LOAD_DIVIDO_DATA'; payload: { people: Person[]; expenseGroups: ExpenseGroup[]; expenses: Expense[]; settlements: Settlement[] } }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'CLEAR_WALLY_DATA' }
  | { type: 'CLEAR_DIVIDO_DATA' }
  // Divido actions
  | { type: 'ADD_PERSON'; payload: Person }
  | { type: 'UPDATE_PERSON'; payload: Person }
  | { type: 'DELETE_PERSON'; payload: string }
  | { type: 'ADD_EXPENSE_GROUP'; payload: ExpenseGroup }
  | { type: 'UPDATE_EXPENSE_GROUP'; payload: ExpenseGroup }
  | { type: 'DELETE_EXPENSE_GROUP'; payload: string }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_SETTLEMENT'; payload: Settlement }
  | { type: 'UPDATE_SETTLEMENT'; payload: Settlement }
  | { type: 'SET_SELECTED_EXPENSE_GROUP'; payload: string | null }
  | { type: 'SET_SELECTED_EXPENSE'; payload: string | null }
  | { type: 'SET_SELECTED_PERSON'; payload: string | null };

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
  { id: '2', name: 'Transportation', type: 'expense', icon: defaultCategoryIcons['Transportation'], color: '#ed9149' },
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
    color: '#ed9149',
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
  DATA_VERSION: 'wally_data_version',
  // Divido storage
  PEOPLE: 'wally_people',
  EXPENSE_GROUPS: 'wally_expense_groups',
  EXPENSES: 'wally_expenses',
  SETTLEMENTS: 'wally_settlements',
  // App context (Wally or Divido)
  ACTIVE_APP: 'wally_active_app'
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
    if (!data) {
      return defaultValue;
    }
    
    // Try to parse the JSON data
    try {
      const parsed = JSON.parse(data);
      return parsed;
    } catch (parseError) {
      // If JSON parsing fails, the data is corrupted
      console.error(`Corrupted data detected in ${key}, clearing it:`, parseError);
      // Clear the corrupted data to prevent future issues
      try {
        await AsyncStorage.removeItem(key);
      } catch (removeError) {
        console.error(`Failed to remove corrupted data from ${key}:`, removeError);
      }
      return defaultValue;
    }
  } catch (error) {
    console.error(`Error loading from storage key ${key}:`, error);
    // If there's any other error, try to clear the data and return default
    try {
      await AsyncStorage.removeItem(key);
    } catch (removeError) {
      console.error(`Failed to remove data from ${key}:`, removeError);
    }
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
      STORAGE_KEYS.PEOPLE,
      STORAGE_KEYS.EXPENSE_GROUPS,
      STORAGE_KEYS.EXPENSES,
      STORAGE_KEYS.SETTLEMENTS,
      STORAGE_KEYS.ACTIVE_APP
    ]);
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

const clearWallyStorage = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.ACCOUNTS,
    ]);
  } catch (error) {
    console.error('Error clearing Wally storage:', error);
  }
};

const clearDividoStorage = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PEOPLE,
      STORAGE_KEYS.EXPENSE_GROUPS,
      STORAGE_KEYS.EXPENSES,
      STORAGE_KEYS.SETTLEMENTS
    ]);
  } catch (error) {
    console.error('Error clearing Divido storage:', error);
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
  categoryTransactions: [],
  // Divido initial state
  people: [],
  expenseGroups: [],
  expenses: [],
  settlements: [],
  selectedExpenseGroupId: null,
  selectedExpenseId: null,
  selectedPersonId: null
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
      // Don't add to history if it's the same screen
      if (state.currentScreen === action.payload.screen) {
        return {
          ...state,
          selectedTransactionId: action.payload.transactionId
        };
      }
      return {
        ...state,
        currentScreen: action.payload.screen,
        selectedTransactionId: action.payload.transactionId,
        navigationHistory: [...state.navigationHistory, action.payload.screen]
      };
    case 'SET_SCREEN_WITH_CATEGORY':
      // Don't add to history if it's the same screen
      if (state.currentScreen === action.payload.screen) {
        return {
          ...state,
          selectedCategory: action.payload.categoryName,
          categoryTransactions: action.payload.transactions
        };
      }
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
    case 'LOAD_DIVIDO_DATA':
      return {
        ...state,
        people: action.payload.people,
        expenseGroups: action.payload.expenseGroups,
        expenses: action.payload.expenses,
        settlements: action.payload.settlements
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
    case 'CLEAR_WALLY_DATA':
      // Clear only Wally data (transactions, categories, accounts)
      clearWallyStorage();
      return {
        ...state,
        transactions: [],
        categories: defaultCategories,
        accounts: [],
        selectedAccountId: null,
        selectedTransactionId: null,
        selectedCategory: null,
        categoryTransactions: []
      };
    case 'CLEAR_DIVIDO_DATA':
      // Clear only Divido data (people, expense groups, expenses, settlements)
      clearDividoStorage();
      return {
        ...state,
        people: [],
        expenseGroups: [],
        expenses: [],
        settlements: [],
        selectedExpenseGroupId: null,
        selectedExpenseId: null,
        selectedPersonId: null
      };
    // Divido actions
    case 'ADD_PERSON':
      return {
        ...state,
        people: [...state.people, action.payload]
      };
    case 'UPDATE_PERSON':
      return {
        ...state,
        people: state.people.map(p => 
          p.id === action.payload.id ? action.payload : p
        )
      };
    case 'DELETE_PERSON':
      // Also remove person from all expense groups and delete related expenses
      const updatedGroups = state.expenseGroups.map(group => ({
        ...group,
        members: group.members.filter(memberId => memberId !== action.payload)
      })).filter(group => group.members.length > 0); // Remove groups with no members
      
      return {
        ...state,
        people: state.people.filter(p => p.id !== action.payload),
        expenseGroups: updatedGroups,
        expenses: state.expenses.filter(e => {
          const group = state.expenseGroups.find(g => g.id === e.groupId);
          return group && group.members.includes(action.payload);
        })
      };
    case 'ADD_EXPENSE_GROUP':
      return {
        ...state,
        expenseGroups: [...state.expenseGroups, action.payload]
      };
    case 'UPDATE_EXPENSE_GROUP':
      return {
        ...state,
        expenseGroups: state.expenseGroups.map(g => 
          g.id === action.payload.id ? action.payload : g
        )
      };
    case 'DELETE_EXPENSE_GROUP':
      return {
        ...state,
        expenseGroups: state.expenseGroups.filter(g => g.id !== action.payload),
        expenses: state.expenses.filter(e => e.groupId !== action.payload),
        settlements: state.settlements.filter(s => s.groupId !== action.payload)
      };
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [...state.expenses, action.payload]
      };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(e => 
          e.id === action.payload.id ? action.payload : e
        )
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(e => e.id !== action.payload)
      };
    case 'ADD_SETTLEMENT':
      return {
        ...state,
        settlements: [...state.settlements, action.payload]
      };
    case 'UPDATE_SETTLEMENT':
      return {
        ...state,
        settlements: state.settlements.map(s => 
          s.id === action.payload.id ? action.payload : s
        )
      };
    case 'SET_SELECTED_EXPENSE_GROUP':
      return {
        ...state,
        selectedExpenseGroupId: action.payload
      };
    case 'SET_SELECTED_EXPENSE':
      return {
        ...state,
        selectedExpenseId: action.payload
      };
    case 'SET_SELECTED_PERSON':
      return {
        ...state,
        selectedPersonId: action.payload
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
  // Divido data
  people: Person[];
  expenseGroups: ExpenseGroup[];
  expenses: Expense[];
  settlements: Settlement[];
}

/**
 * Normalize pasted/loaded backup JSON so JSON.parse succeeds.
 * - Strips BOM (byte order mark)
 * - Trims whitespace
 * - Replaces smart/curly quotes with straight quotes
 * - Removes other control characters that break parsing
 */
export function normalizeBackupJson(raw: string): string {
  if (typeof raw !== 'string') return '';
  let s = raw
    .replace(/^\uFEFF/, '') // BOM
    .trim();
  // Replace common smart quotes and dashes that break JSON
  s = s
    .replace(/\u201C/g, '"')  // "
    .replace(/\u201D/g, '"')  // "
    .replace(/\u2018/g, "'")  // '
    .replace(/\u2019/g, "'")  // '
    .replace(/\uFF02/g, '"'); // fullwidth "
  // Remove null bytes and other control chars (keep \n \r \t)
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return s.trim();
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  currencies: Currency[];
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
  formatCurrency: (amount: number, currency?: Currency) => string;
  exportData: () => Promise<string>;
  importData: (backupJson: string) => Promise<{ success: boolean; message: string }>;
  exportDividoData: () => Promise<string>;
  importDividoData: (backupJson: string) => Promise<{ success: boolean; message: string }>;
} | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Hooks must be called unconditionally
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Wrap reducer dispatch to catch any errors
  const safeDispatch = React.useCallback((action: AppAction) => {
    try {
      dispatch(action);
    } catch (error) {
      console.error('Error in reducer dispatch:', error);
      // Don't crash, just log the error
    }
  }, []);

  // Load data from storage on app start
  useEffect(() => {
    let loadingTimeout: NodeJS.Timeout | null = null;
    
    // Set a timeout to prevent infinite loading
    loadingTimeout = setTimeout(() => {
      console.warn('Data loading timeout, forcing app to load with defaults');
      setIsLoaded(true);
    }, 10000); // 10 second timeout

    const loadData = async () => {
      try {
        setHasError(false);
        // Ensure AsyncStorage is available
        if (!AsyncStorage) {
          console.error('AsyncStorage is not available');
          clearTimeout(loadingTimeout);
          setIsLoaded(true);
          return;
        }
        
        // Check if this is a fresh installation by looking for any existing data
        let hasExistingData = false;
        try {
          const transactionsData = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
          hasExistingData = transactionsData !== null;
        } catch (checkError) {
          console.error('Error checking for existing data:', checkError);
          hasExistingData = false;
        }
        
        if (hasExistingData) {
          // Load existing data from storage with individual error handling
          // Use Promise.allSettled to ensure all loads complete even if some fail
          const results = await Promise.allSettled([
            loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []),
            loadFromStorage(STORAGE_KEYS.CATEGORIES, defaultCategories),
            loadFromStorage(STORAGE_KEYS.ACCOUNTS, []),
            loadFromStorage(STORAGE_KEYS.CURRENCY, initialState.currentCurrency),
            loadFromStorage(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION),
            loadFromStorage(STORAGE_KEYS.PEOPLE, []),
            loadFromStorage(STORAGE_KEYS.EXPENSE_GROUPS, []),
            loadFromStorage(STORAGE_KEYS.EXPENSES, []),
            loadFromStorage(STORAGE_KEYS.SETTLEMENTS, []),
            loadFromStorage(STORAGE_KEYS.ACTIVE_APP, 'wally')
          ]);

          // Extract values from results, using defaults if any failed
          const transactions = results[0].status === 'fulfilled' ? results[0].value : [];
          const categories = results[1].status === 'fulfilled' ? results[1].value : defaultCategories;
          const accounts = results[2].status === 'fulfilled' ? results[2].value : [];
          const currency = results[3].status === 'fulfilled' ? results[3].value : initialState.currentCurrency;
          const dataVersion = results[4].status === 'fulfilled' ? results[4].value : CURRENT_DATA_VERSION;
          const people = results[5].status === 'fulfilled' ? results[5].value : [];
          const expenseGroups = results[6].status === 'fulfilled' ? results[6].value : [];
          const expenses = results[7].status === 'fulfilled' ? results[7].value : [];
          const settlements = results[8].status === 'fulfilled' ? results[8].value : [];
          const activeApp = results[9].status === 'fulfilled' ? results[9].value : 'wally';

          // Log any failures for debugging
          const keys = [
            STORAGE_KEYS.TRANSACTIONS,
            STORAGE_KEYS.CATEGORIES,
            STORAGE_KEYS.ACCOUNTS,
            STORAGE_KEYS.CURRENCY,
            STORAGE_KEYS.DATA_VERSION,
            STORAGE_KEYS.PEOPLE,
            STORAGE_KEYS.EXPENSE_GROUPS,
            STORAGE_KEYS.EXPENSES,
            STORAGE_KEYS.SETTLEMENTS,
            STORAGE_KEYS.ACTIVE_APP
          ];
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.error(`Failed to load ${keys[index]}:`, result.reason);
            }
          });
          
          // Log successful data load summary
          const loadedCount = results.filter(r => r.status === 'fulfilled').length;
          console.log(`Successfully loaded ${loadedCount}/${results.length} storage items`);

          // Future: Add migration logic here if dataVersion !== CURRENT_DATA_VERSION
          if (dataVersion !== CURRENT_DATA_VERSION) {
            // Migration logic can be added here in the future
          }

          // Ensure data integrity - validate and fix if needed
          const validTransactions = Array.isArray(transactions) ? transactions : [];
          const validCategories = Array.isArray(categories) && categories.length > 0 ? categories : defaultCategories;
          const validAccounts = Array.isArray(accounts) ? accounts : [];
          const validCurrency = currency && typeof currency === 'object' && currency.code ? currency : initialState.currentCurrency;
          const validPeople = Array.isArray(people) ? people : [];
          const validExpenseGroups = Array.isArray(expenseGroups) ? expenseGroups : [];
          const validExpenses = Array.isArray(expenses) ? expenses : [];
          const validSettlements = Array.isArray(settlements) ? settlements : [];
          
          // Restore to where user left off, but only to safe screens
          // Safe screens don't require specific data (no detail/edit screens)
          // Wally safe screens: 'dashboard', 'transactions', 'accounts', 'reports', 'settings', 'categories'
          // Divido safe screens: 'divido', 'people-list', 'divido-settings'
          let restoredScreen: Screen = 'dashboard';
          
          if (activeApp === 'divido') {
            // User was in Divido - restore to Divido home
            restoredScreen = 'divido';
          } else {
            // User was in Wally - restore to dashboard
            restoredScreen = 'dashboard';
          }
          
          const restoredNavigation = [restoredScreen];

          dispatch({ type: 'LOAD_DATA', payload: {
            transactions: validTransactions,
            categories: validCategories,
            accounts: validAccounts,
            currentCurrency: validCurrency,
            people: validPeople,
            expenseGroups: validExpenseGroups,
            expenses: validExpenses,
            settlements: validSettlements,
            currentScreen: restoredScreen,
            navigationHistory: restoredNavigation,
            selectedExpenseGroupId: null,
            selectedExpenseId: null,
            selectedPersonId: null,
            selectedAccountId: null,
            selectedTransactionId: null,
            selectedCategory: null
          }});
        } else {
          // Fresh installation - start with empty data
          dispatch({ type: 'LOAD_DATA', payload: {
            transactions: [],
            categories: defaultCategories,
            accounts: [],
            currentCurrency: initialState.currentCurrency,
            people: [],
            expenseGroups: [],
            expenses: [],
            settlements: [],
            currentScreen: 'dashboard',
            navigationHistory: ['dashboard']
          }});
        }
        
        if (loadingTimeout) clearTimeout(loadingTimeout);
        setIsLoaded(true);
      } catch (error) {
        console.error('Critical error loading data:', error);
        if (loadingTimeout) clearTimeout(loadingTimeout);
        setHasError(true);
        
        // On error, start with clean state and try to clear any corrupted storage
        try {
          // Attempt to clear all storage to prevent future issues
          await clearAllStorage();
          console.log('Storage cleared due to error');
        } catch (clearError) {
          console.error('Error clearing storage after failure:', clearError);
          // Try to clear everything as last resort
          try {
            await AsyncStorage.clear();
          } catch (finalClearError) {
            console.error('Final storage clear failed:', finalClearError);
          }
        }
        
        // Start with clean state - ensure this always succeeds
        try {
          safeDispatch({ type: 'LOAD_DATA', payload: {
            transactions: [],
            categories: defaultCategories,
            accounts: [],
            currentCurrency: initialState.currentCurrency,
            people: [],
            expenseGroups: [],
            expenses: [],
            settlements: [],
            currentScreen: 'dashboard',
            navigationHistory: ['dashboard']
          }});
        } catch (dispatchError) {
          console.error('Error dispatching initial state:', dispatchError);
          // If dispatch fails, state is already at initialState, which is fine
        }
        
        setIsLoaded(true);
      }
    };

    // Wrap loadData in a try-catch to ensure we always set isLoaded
    try {
      loadData();
    } catch (error) {
      console.error('Fatal error in loadData initialization:', error);
      if (loadingTimeout) clearTimeout(loadingTimeout);
      setHasError(true);
      setIsLoaded(true); // Always set loaded to true so app can render
      
      // Try to clear storage on fatal error
      clearAllStorage().catch((clearError) => {
        console.error('Error clearing storage on fatal error:', clearError);
      });
    }

    // Cleanup timeout on unmount
    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, []);

  // Save data to storage whenever state changes
  useEffect(() => {
    if (isLoaded) {
      const saveData = async () => {
        try {
          // Ensure AsyncStorage is available
          if (!AsyncStorage) {
            console.error('AsyncStorage is not available for saving');
            return;
          }
          
          // Determine which app the user is currently in
          // Divido screens: 'divido', 'expense-group-detail', 'add-expense-group', 'edit-expense-group', 'people-list', 'add-person', 'edit-person', 'add-expense', 'edit-expense', 'divido-settings'
          const dividoScreens = ['divido', 'expense-group-detail', 'add-expense-group', 'edit-expense-group', 'people-list', 'add-person', 'edit-person', 'add-expense', 'edit-expense', 'divido-settings'];
          const activeApp = dividoScreens.includes(state.currentScreen) ? 'divido' : 'wally';
          
          await Promise.all([
          saveToStorage(STORAGE_KEYS.TRANSACTIONS, state.transactions),
          saveToStorage(STORAGE_KEYS.CATEGORIES, state.categories),
          saveToStorage(STORAGE_KEYS.ACCOUNTS, state.accounts),
          saveToStorage(STORAGE_KEYS.CURRENCY, state.currentCurrency),
          saveToStorage(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION),
          saveToStorage(STORAGE_KEYS.PEOPLE, state.people),
          saveToStorage(STORAGE_KEYS.EXPENSE_GROUPS, state.expenseGroups),
          saveToStorage(STORAGE_KEYS.EXPENSES, state.expenses),
          saveToStorage(STORAGE_KEYS.SETTLEMENTS, state.settlements),
          // Save only which app the user is in (Wally or Divido)
          saveToStorage(STORAGE_KEYS.ACTIVE_APP, activeApp)
        ]);
        } catch (error) {
          console.error('Error saving data:', error);
          // Don't throw - just log the error to prevent crashes
        }
      };
      saveData();
    }
  }, [
    state.transactions, state.categories, state.accounts, state.currentCurrency, 
    state.people, state.expenseGroups, state.expenses, state.settlements,
    state.currentScreen,
    isLoaded
  ]);

  // Export data as JSON string (Wally: transactions, categories, accounts, currency, plus Divido data)
  const exportData = async (): Promise<string> => {
    try {
      const backupData: BackupData = {
        version: CURRENT_DATA_VERSION,
        timestamp: new Date().toISOString(),
        transactions: Array.isArray(state.transactions) ? state.transactions : [],
        categories: Array.isArray(state.categories) ? state.categories : [],
        accounts: Array.isArray(state.accounts) ? state.accounts : [],
        currentCurrency: state.currentCurrency,
        people: Array.isArray(state.people) ? state.people : [],
        expenseGroups: Array.isArray(state.expenseGroups) ? state.expenseGroups : [],
        expenses: Array.isArray(state.expenses) ? state.expenses : [],
        settlements: Array.isArray(state.settlements) ? state.settlements : []
      };
      const json = JSON.stringify(backupData, null, 2);
      // Sanity check: ensure it parses back
      JSON.parse(json);
      return json;
    } catch (e) {
      console.error('Export failed:', e);
      return '';
    }
  };

  // Export Divido data only
  const exportDividoData = async (): Promise<string> => {
    try {
      const backupData = {
        version: CURRENT_DATA_VERSION,
        timestamp: new Date().toISOString(),
        type: 'divido',
        people: Array.isArray(state.people) ? state.people : [],
        expenseGroups: Array.isArray(state.expenseGroups) ? state.expenseGroups : [],
        expenses: Array.isArray(state.expenses) ? state.expenses : [],
        settlements: Array.isArray(state.settlements) ? state.settlements : []
      };
      const json = JSON.stringify(backupData, null, 2);
      JSON.parse(json);
      return json;
    } catch (e) {
      console.error('Divido export failed:', e);
      return '';
    }
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

    // currentCurrency is optional; if present must have code/symbol/name (fallback used in import)
    if (data.currentCurrency != null && typeof data.currentCurrency === 'object') {
      if (!data.currentCurrency.code || !data.currentCurrency.symbol || !data.currentCurrency.name) {
        return { valid: false, message: 'Invalid backup file: Invalid currency format' };
      }
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
        if (account.type !== 'trip' && account.type !== 'savings' && account.type !== 'investment' && account.type !== 'other') {
          return { valid: false, message: 'Invalid backup file: Invalid account type' };
        }
      }
    }

    return { valid: true, message: '' };
  };

  // Import data from JSON string
  const importData = async (backupJson: string): Promise<{ success: boolean; message: string }> => {
    try {
      const normalized = normalizeBackupJson(backupJson || '');
      if (!normalized) {
        return { success: false, message: 'Backup data is empty. Please paste or select a valid Wally backup file.' };
      }
      // First, try to parse JSON
      let backupData: BackupData;
      try {
        const parsed = JSON.parse(normalized);
        // Handle double-encoded JSON (e.g. pasted from a log that showed a string)
        backupData = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
      } catch (parseError) {
        const errMsg = parseError instanceof Error ? parseError.message : 'Invalid JSON';
        return { success: false, message: `Invalid JSON: ${errMsg}. Make sure you pasted the full backup (starts with { and ends with }). Try "Paste from clipboard" if you copied from another app.` };
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
        people: backupData.people || [],
        expenseGroups: backupData.expenseGroups || [],
        expenses: backupData.expenses || [],
        settlements: backupData.settlements || [],
        currentScreen: 'dashboard',
        navigationHistory: ['dashboard']
      }});

      // Save to storage
      await Promise.all([
        saveToStorage(STORAGE_KEYS.TRANSACTIONS, backupData.transactions || []),
        saveToStorage(STORAGE_KEYS.CATEGORIES, backupData.categories || defaultCategories),
        saveToStorage(STORAGE_KEYS.ACCOUNTS, backupData.accounts || []),
        saveToStorage(STORAGE_KEYS.CURRENCY, backupData.currentCurrency || initialState.currentCurrency),
        saveToStorage(STORAGE_KEYS.DATA_VERSION, backupData.version || CURRENT_DATA_VERSION),
        saveToStorage(STORAGE_KEYS.PEOPLE, backupData.people || []),
        saveToStorage(STORAGE_KEYS.EXPENSE_GROUPS, backupData.expenseGroups || []),
        saveToStorage(STORAGE_KEYS.EXPENSES, backupData.expenses || []),
        saveToStorage(STORAGE_KEYS.SETTLEMENTS, backupData.settlements || [])
      ]);

      return { success: true, message: 'Data imported successfully' };
    } catch (error) {
      console.error('Error importing data:', error);
      return { success: false, message: 'Failed to import data. Please check the backup file format.' };
    }
  };

  // Validate Divido backup data structure
  const validateDividoBackupData = (data: any): { valid: boolean; message: string } => {
    if (!data || typeof data !== 'object') {
      return { valid: false, message: 'Invalid backup file: Not a valid JSON object' };
    }

    if (!data.version || typeof data.version !== 'string') {
      return { valid: false, message: 'Invalid backup file: Missing or invalid version field' };
    }

    if (!data.timestamp || typeof data.timestamp !== 'string') {
      return { valid: false, message: 'Invalid backup file: Missing or invalid timestamp field' };
    }

    if (data.type && data.type !== 'divido') {
      return { valid: false, message: 'Invalid backup file: This does not appear to be a Divido backup file. Please ensure you are importing a file exported from Divido.' };
    }

    if (!Array.isArray(data.people)) {
      return { valid: false, message: 'Invalid backup file: Missing or invalid people array' };
    }

    if (!Array.isArray(data.expenseGroups)) {
      return { valid: false, message: 'Invalid backup file: Missing or invalid expenseGroups array' };
    }

    if (!Array.isArray(data.expenses)) {
      return { valid: false, message: 'Invalid backup file: Missing or invalid expenses array' };
    }

    if (!Array.isArray(data.settlements)) {
      return { valid: false, message: 'Invalid backup file: Missing or invalid settlements array' };
    }

    return { valid: true, message: '' };
  };

  // Import Divido data from JSON string
  const importDividoData = async (backupJson: string): Promise<{ success: boolean; message: string }> => {
    try {
      const normalized = normalizeBackupJson(backupJson || '');
      if (!normalized) {
        return { success: false, message: 'Backup data is empty. Please paste or select a valid Divido backup file.' };
      }
      let backupData: any;
      try {
        const parsed = JSON.parse(normalized);
        backupData = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
      } catch (parseError) {
        const errMsg = parseError instanceof Error ? parseError.message : 'Invalid JSON';
        return { success: false, message: `Invalid JSON: ${errMsg}. Make sure you pasted the full backup (starts with { and ends with }). Try "Paste from clipboard" if you copied from another app.` };
      }

      // Validate backup data structure
      const validation = validateDividoBackupData(backupData);
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      // Check version compatibility
      if (backupData.version !== CURRENT_DATA_VERSION) {
        console.warn(`Backup version ${backupData.version} differs from current ${CURRENT_DATA_VERSION}`);
      }

      // Import only Divido data (people, expenseGroups, expenses, settlements)
      dispatch({ type: 'LOAD_DIVIDO_DATA', payload: {
        people: backupData.people || [],
        expenseGroups: backupData.expenseGroups || [],
        expenses: backupData.expenses || [],
        settlements: backupData.settlements || []
      }});

      // Save to storage
      await Promise.all([
        saveToStorage(STORAGE_KEYS.PEOPLE, backupData.people || []),
        saveToStorage(STORAGE_KEYS.EXPENSE_GROUPS, backupData.expenseGroups || []),
        saveToStorage(STORAGE_KEYS.EXPENSES, backupData.expenses || []),
        saveToStorage(STORAGE_KEYS.SETTLEMENTS, backupData.settlements || [])
      ]);

      return { success: true, message: 'Divido data imported successfully!' };
    } catch (error) {
      console.error('Error importing Divido data:', error);
      return { success: false, message: `Failed to import Divido data: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string) => {
    const fromRate = currencies.find(c => c.code === fromCurrency)?.rate || 1;
    const toRate = currencies.find(c => c.code === toCurrency)?.rate || 1;
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  };

  const formatCurrency = (amount: number, currency = (state?.currentCurrency || initialState.currentCurrency)) => {
    const safeCurrency = currency || initialState.currentCurrency;
    return `${safeCurrency.symbol}${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Always provide a valid context, even during loading or errors
  // This ensures useApp() never throws "must be used within AppProvider"
  const safeState = hasError ? initialState : (state || initialState);
  const safeDispatchFn = hasError ? (() => {}) : safeDispatch;
  const safeCurrency = safeState.currentCurrency || initialState.currentCurrency;
  
  const contextValue = !isLoaded ? {
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
    exportData: async () => JSON.stringify({ version: CURRENT_DATA_VERSION, timestamp: new Date().toISOString(), transactions: [], categories: [], accounts: [], currentCurrency: initialState.currentCurrency, people: [], expenseGroups: [], expenses: [], settlements: [] }),
    importData: async () => ({ success: false, message: 'App is still loading' }),
    exportDividoData: async () => JSON.stringify({ version: CURRENT_DATA_VERSION, timestamp: new Date().toISOString(), type: 'divido', people: [], expenseGroups: [], expenses: [], settlements: [] }),
    importDividoData: async () => ({ success: false, message: 'App is still loading' })
  } : {
    state: safeState,
    dispatch: safeDispatchFn,
    currencies,
    convertAmount,
    formatCurrency: (amount: number, currency = safeCurrency) => {
      return `${currency.symbol}${amount.toLocaleString('en-US', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2 
      })}`;
    },
    exportData,
    importData,
    exportDividoData,
    importDividoData
  };

  // Always render the provider with a valid context value
  // This prevents "useApp must be used within AppProvider" errors
  try {
    return (
      <AppContext.Provider value={contextValue}>
        {children}
      </AppContext.Provider>
    );
  } catch (error) {
    // If rendering fails, try to render with minimal context
    console.error('Error rendering AppProvider, using fallback:', error);
    return (
      <AppContext.Provider value={{
        state: initialState,
        dispatch: () => {},
        currencies,
        convertAmount: () => 0,
        formatCurrency: () => '',
        exportData: async () => '{}',
        importData: async () => ({ success: false, message: 'Error occurred' }),
        exportDividoData: async () => '{}',
        importDividoData: async () => ({ success: false, message: 'Error occurred' })
      }}>
        {children}
      </AppContext.Provider>
    );
  }
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}