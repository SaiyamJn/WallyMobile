import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Transaction, Category, Currency, Screen, Account } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  currentCurrency: Currency;
  currentScreen: Screen;
  navigationHistory: Screen[];
  selectedAccountId: string | null;
}

type AppAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'UPDATE_ACCOUNT_BALANCE'; payload: { accountId: string; amount: number } }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'SET_SCREEN'; payload: Screen }
  | { type: 'SET_SCREEN_WITH_ACCOUNT'; payload: { screen: Screen; accountId: string | null } }
  | { type: 'SET_SELECTED_ACCOUNT'; payload: string | null }
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
  { id: '1', name: 'Food & Dining', type: 'expense', icon: '🍴', color: '#ef4444' },
  { id: '2', name: 'Transportation', type: 'expense', icon: '🚗', color: '#3b82f6' },
  { id: '3', name: 'Shopping', type: 'expense', icon: '🛒', color: '#8b5cf6' },
  { id: '4', name: 'Entertainment', type: 'expense', icon: '🎬', color: '#f59e0b' },
  { id: '5', name: 'Bills & Utilities', type: 'expense', icon: '⚡', color: '#10b981' },
  { id: '6', name: 'Healthcare', type: 'expense', icon: '🏥', color: '#ec4899' },
  { id: '7', name: 'Salary', type: 'income', icon: '💼', color: '#059669' },
  { id: '8', name: 'Freelance', type: 'income', icon: '💻', color: '#0ea5e9' },
  { id: '9', name: 'Investment', type: 'income', icon: '📊', color: '#8b5cf6' },
  { id: '10', name: 'Other Income', type: 'income', icon: '💳', color: '#f59e0b' },
];

const defaultAccounts: Account[] = [
  {
    id: '1',
    name: 'Main Account',
    type: 'other',
    description: 'Primary account for daily expenses',
    icon: '💳',
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
  NAVIGATION: 'wally_navigation'
};

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

const initialState: AppState = {
  transactions: [
    {
      id: '1',
      amount: 5000,
      type: 'income',
      category: 'Salary',
      description: 'Monthly salary',
      date: '2024-01-15',
      currency: 'INR',
      accountId: '1'
    },
    {
      id: '2',
      amount: 45,
      type: 'expense',
      category: 'Food & Dining',
      description: 'Lunch at restaurant',
      date: '2024-01-16',
      currency: 'INR',
      accountId: '1'
    },
    {
      id: '3',
      amount: 120,
      type: 'expense',
      category: 'Shopping',
      description: 'Groceries',
      date: '2024-01-16',
      currency: 'INR',
      accountId: '1'
    }
  ],
  categories: defaultCategories,
  accounts: defaultAccounts,
  currentCurrency: currencies.find(c => c.code === 'INR') || currencies[0],
  currentScreen: 'dashboard',
  navigationHistory: ['dashboard'],
  selectedAccountId: null
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [...state.transactions, action.payload]
      };
    case 'DELETE_TRANSACTION':
      console.log('Reducer: DELETE_TRANSACTION called with ID:', action.payload);
      console.log('Current transactions count:', state.transactions.length);
      console.log('Current transactions:', state.transactions.map(t => ({ id: t.id, description: t.description })));
      const filteredTransactions = state.transactions.filter(t => t.id !== action.payload);
      console.log('Filtered transactions count:', filteredTransactions.length);
      console.log('Filtered transactions:', filteredTransactions.map(t => ({ id: t.id, description: t.description })));
      const newState = {
        ...state,
        transactions: filteredTransactions
      };
      console.log('New state transactions count:', newState.transactions.length);
      return newState;
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload]
      };
    case 'DELETE_CATEGORY':
      console.log('Reducer: DELETE_CATEGORY called with ID:', action.payload);
      console.log('Current categories count:', state.categories.length);
      const filteredCategories = state.categories.filter(c => c.id !== action.payload);
      console.log('Filtered categories count:', filteredCategories.length);
      return {
        ...state,
        categories: filteredCategories
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
      return {
        ...initialState,
        currentScreen: 'dashboard',
        navigationHistory: ['dashboard'],
        selectedAccountId: null
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  currencies: Currency[];
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
  formatCurrency: (amount: number, currency?: Currency) => string;
} | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load data from storage on app start
  useEffect(() => {
    const loadData = async () => {
      try {
        const [transactions, categories, accounts, currency] = await Promise.all([
          loadFromStorage(STORAGE_KEYS.TRANSACTIONS, initialState.transactions),
          loadFromStorage(STORAGE_KEYS.CATEGORIES, initialState.categories),
          loadFromStorage(STORAGE_KEYS.ACCOUNTS, initialState.accounts),
          loadFromStorage(STORAGE_KEYS.CURRENCY, initialState.currentCurrency)
          // Don't load screen and navigation - always start on dashboard
        ]);

        // Dispatch initial data load - always start on dashboard but preserve data
        dispatch({ type: 'LOAD_DATA', payload: {
          transactions,
          categories,
          accounts,
          currentCurrency: currency,
          currentScreen: 'dashboard', // Always start on dashboard
          navigationHistory: ['dashboard'] // Reset navigation to dashboard
        }});
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
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
          saveToStorage(STORAGE_KEYS.CURRENCY, state.currentCurrency)
          // Don't save screen and navigation - always start on dashboard
        ]);
      };
      saveData();
    }
  }, [state, isLoaded]);

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
  if (!isLoaded) {
    return null; // or a loading component
  }

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      currencies,
      convertAmount,
      formatCurrency
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