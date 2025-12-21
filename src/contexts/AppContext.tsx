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
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from storage on app start
  useEffect(() => {
    const loadData = async () => {
      try {
        // Ensure AsyncStorage is available
        if (!AsyncStorage) {
          console.error('AsyncStorage is not available');
          setIsLoaded(true);
          return;
        }
        
        // Check if this is a fresh installation by looking for any existing data
        const hasExistingData = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        
        if (hasExistingData) {
          // Load existing data from storage
          const [
            transactions, categories, accounts, currency, dataVersion, 
            people, expenseGroups, expenses, settlements,
            activeApp
          ] = await Promise.all([
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
          
          // Determine which app to restore to based on saved active app
          // Divido screens: 'divido', 'expense-group-detail', 'add-expense-group', 'edit-expense-group', 'people-list', 'add-person', 'edit-person', 'add-expense', 'edit-expense', 'divido-settings'
          // Wally screens: everything else
          const restoredScreen = activeApp === 'divido' ? 'divido' : 'dashboard';
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
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
        // On error, start with clean state
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
        setIsLoaded(true);
      }
    };

    loadData();
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

  // Export data as JSON string
  const exportData = async (): Promise<string> => {
    const backupData: BackupData = {
      version: CURRENT_DATA_VERSION,
      timestamp: new Date().toISOString(),
      transactions: state.transactions,
      categories: state.categories,
      accounts: state.accounts,
      currentCurrency: state.currentCurrency,
      people: state.people,
      expenseGroups: state.expenseGroups,
      expenses: state.expenses,
      settlements: state.settlements
    };
    return JSON.stringify(backupData, null, 2);
  };

  // Export Divido data only
  const exportDividoData = async (): Promise<string> => {
    const backupData = {
      version: CURRENT_DATA_VERSION,
      timestamp: new Date().toISOString(),
      type: 'divido',
      people: state.people,
      expenseGroups: state.expenseGroups,
      expenses: state.expenses,
      settlements: state.settlements
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
      let backupData: any;
      try {
        backupData = JSON.parse(backupJson);
      } catch (parseError) {
        return { success: false, message: 'Invalid backup file: Not a valid JSON file. Please ensure you are importing a Divido backup file.' };
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
        exportData: async () => JSON.stringify({ version: CURRENT_DATA_VERSION, timestamp: new Date().toISOString(), transactions: [], categories: [], accounts: [], currentCurrency: initialState.currentCurrency, people: [], expenseGroups: [], expenses: [], settlements: [] }),
        importData: async () => ({ success: false, message: 'App is still loading' }),
        exportDividoData: async () => JSON.stringify({ version: CURRENT_DATA_VERSION, timestamp: new Date().toISOString(), type: 'divido', people: [], expenseGroups: [], expenses: [], settlements: [] }),
        importDividoData: async () => ({ success: false, message: 'App is still loading' })
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
      importData,
      exportDividoData,
      importDividoData
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