export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  currency: string;
  accountId?: string; // Optional, only for income transactions
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Rate relative to USD
}

export interface Account {
  id: string;
  name: string;
  type: 'trip' | 'savings' | 'investment' | 'other';
  description: string;
  icon: string;
  color: string;
  balance: number;
  currency: string;
  createdAt: string;
}

export type Screen = 'dashboard' | 'transactions' | 'add-transaction' | 'edit-transaction' | 'categories' | 'reports' | 'settings' | 'accounts' | 'category-transactions';