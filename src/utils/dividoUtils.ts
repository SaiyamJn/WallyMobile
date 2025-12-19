import { Person, Expense, ExpenseGroup, Settlement } from '../types';

export interface PersonBalance {
  personId: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // Positive = they are owed, Negative = they owe
}

export interface Debt {
  from: string; // Person ID who owes
  to: string; // Person ID who is owed
  amount: number;
}

/**
 * Calculate balances for all people in a group
 */
export function calculateBalances(
  group: ExpenseGroup,
  expenses: Expense[],
  people: Person[]
): PersonBalance[] {
  const groupExpenses = expenses.filter(e => e.groupId === group.id);
  const balances: Map<string, PersonBalance> = new Map();

  // Initialize balances for all group members
  group.members.forEach(memberId => {
    balances.set(memberId, {
      personId: memberId,
      totalPaid: 0,
      totalOwed: 0,
      netBalance: 0
    });
  });

  // Calculate balances from expenses
  groupExpenses.forEach(expense => {
    const paidByBalance = balances.get(expense.paidBy);
    if (paidByBalance) {
      paidByBalance.totalPaid += expense.amount;
      paidByBalance.netBalance += expense.amount;
    }

    // Subtract what each person owes
    expense.splits.forEach(split => {
      const splitBalance = balances.get(split.personId);
      if (splitBalance) {
        splitBalance.totalOwed += split.amount;
        splitBalance.netBalance -= split.amount;
      }
    });
  });

  return Array.from(balances.values());
}

/**
 * Calculate simplified debts (minimize number of transactions)
 * Uses a greedy algorithm to simplify who owes whom
 */
export function calculateSimplifiedDebts(
  balances: PersonBalance[]
): Debt[] {
  const debts: Debt[] = [];
  const sortedBalances = [...balances].sort((a, b) => b.netBalance - a.netBalance);

  let i = 0; // Pointer for people who are owed (positive balance)
  let j = sortedBalances.length - 1; // Pointer for people who owe (negative balance)

  while (i < j) {
    const creditor = sortedBalances[i];
    const debtor = sortedBalances[j];

    if (creditor.netBalance <= 0 || debtor.netBalance >= 0) {
      break;
    }

    const amount = Math.min(creditor.netBalance, Math.abs(debtor.netBalance));

    if (amount > 0.01) { // Only add if amount is significant (avoid rounding errors)
      debts.push({
        from: debtor.personId,
        to: creditor.personId,
        amount: Math.round(amount * 100) / 100 // Round to 2 decimal places
      });

      creditor.netBalance -= amount;
      debtor.netBalance += amount;
    }

    if (creditor.netBalance < 0.01) {
      i++;
    }
    if (Math.abs(debtor.netBalance) < 0.01) {
      j--;
    }
  }

  return debts;
}

/**
 * Get person name by ID
 */
export function getPersonName(personId: string, people: Person[]): string {
  const person = people.find(p => p.id === personId);
  return person ? person.name : 'Unknown';
}

/**
 * Calculate total expenses in a group
 */
export function getGroupTotalExpenses(groupId: string, expenses: Expense[]): number {
  return expenses
    .filter(e => e.groupId === groupId)
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Get expenses for a specific group
 */
export function getGroupExpenses(groupId: string, expenses: Expense[]): Expense[] {
  return expenses.filter(e => e.groupId === groupId);
}

/**
 * Check if a person is in a group
 */
export function isPersonInGroup(personId: string, group: ExpenseGroup): boolean {
  return group.members.includes(personId);
}

/**
 * Get all people in a group
 */
export function getGroupPeople(group: ExpenseGroup, people: Person[]): Person[] {
  return people.filter(p => group.members.includes(p.id));
}

/**
 * Calculate how much a person owes/is owed in a specific group
 */
export function getPersonBalanceInGroup(
  personId: string,
  group: ExpenseGroup,
  expenses: Expense[],
  people: Person[]
): PersonBalance | null {
  const balances = calculateBalances(group, expenses, people);
  return balances.find(b => b.personId === personId) || null;
}
