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

export type Screen = 'dashboard' | 'transactions' | 'add-transaction' | 'edit-transaction' | 'categories' | 'reports' | 'settings' | 'accounts' | 'category-transactions' | 'divido' | 'expense-group-detail' | 'add-expense-group' | 'edit-expense-group' | 'people-list' | 'add-person' | 'edit-person' | 'add-expense' | 'edit-expense' | 'divido-settings';

// Divido Types
export interface Person {
  id: string;
  name: string;
  icon: string; // Will use default icon until user adds custom icons
  color: string;
  createdAt: string;
}

export interface Split {
  personId: string;
  amount: number;
  percentage?: number; // Optional, for percentage-based splits
}

export interface Expense {
  id: string;
  groupId: string;
  paidBy: string; // Person ID who paid
  amount: number;
  description: string;
  date: string;
  splitType: 'equal' | 'custom' | 'percentage';
  splits: Split[];
  currency: string;
  createdAt: string;
}

export interface ExpenseGroup {
  id: string;
  name: string;
  description: string;
  members: string[]; // Array of Person IDs
  createdAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  from: string; // Person ID who owes
  to: string; // Person ID who is owed
  amount: number;
  settled: boolean;
  date: string;
  createdAt: string;
}