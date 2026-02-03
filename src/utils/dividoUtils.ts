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
 * Calculate balances for all people in a group.
 * Handles complex splits correctly: when only a subset of the group is involved
 * in an expense, only those participants are debited; the payer is always credited.
 * Includes anyone who appears in any group expense (payer or in splits) so
 * balances are never dropped for people not in group.members (e.g. legacy data).
 */
export function calculateBalances(
  group: ExpenseGroup,
  expenses: Expense[],
  people: Person[]
): PersonBalance[] {
  const groupExpenses = expenses.filter(e => e.groupId === group.id);
  const balances: Map<string, PersonBalance> = new Map();

  // Collect all person IDs that appear in any group expense (payer or in splits)
  const personIdsInExpenses = new Set<string>(group.members);
  groupExpenses.forEach(expense => {
    personIdsInExpenses.add(expense.paidBy);
    expense.splits.forEach(split => personIdsInExpenses.add(split.personId));
  });

  // Initialize balances for everyone in the group and everyone in any expense
  personIdsInExpenses.forEach(personId => {
    balances.set(personId, {
      personId,
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

    // Subtract what each person owes (only participants in this expense get debited)
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
 * Calculate simplified debts (minimize number of transactions).
 * "X owes Y $Z" means X should pay Y that amount to settle the group.
 * Does not mutate the input balances.
 */
export function calculateSimplifiedDebts(
  balances: PersonBalance[]
): Debt[] {
  const debts: Debt[] = [];
  // Work on copies so we don't mutate the caller's balance objects
  const sortedBalances = balances.map(b => ({
    personId: b.personId,
    netBalance: b.netBalance
  })).sort((a, b) => b.netBalance - a.netBalance);

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
 * Calculate proportional debts for any number of payers and any number of people who owe.
 * Each person who owes (debtor) gets a debt to each person who is owed (creditor), in proportion
 * to that creditor's share of the total amount owed. Works for 1 or many payers and 1 or many debtors.
 * Does not mutate the input balances.
 */
export function calculateProportionalDebts(
  balances: PersonBalance[]
): Debt[] {
  const creditors = balances.filter(b => b.netBalance > 0.01);
  const debtors = balances.filter(b => b.netBalance < -0.01);
  const totalOwed = creditors.reduce((s, c) => s + c.netBalance, 0);
  if (totalOwed < 0.01 || debtors.length === 0) return [];

  const debts: Debt[] = [];
  for (const debtor of debtors) {
    const debtAmount = Math.round(Math.abs(debtor.netBalance) * 100) / 100;
    const creditorShares = creditors.map(c => ({
      personId: c.personId,
      share: c.netBalance / totalOwed
    }));
    // Allocate proportionally; put rounding remainder on last creditor so debtor total matches
    let allocated = 0;
    for (let i = 0; i < creditorShares.length; i++) {
      const exact = debtAmount * creditorShares[i].share;
      const isLast = i === creditorShares.length - 1;
      const amount = isLast
        ? Math.max(0, Math.round((debtAmount - allocated) * 100) / 100)
        : Math.round(exact * 100) / 100;
      allocated += amount;
      if (amount > 0.01) {
        debts.push({
          from: debtor.personId,
          to: creditorShares[i].personId,
          amount
        });
      }
    }
  }
  return debts;
}

/**
 * Return remaining debts after subtracting all settled amounts for this group.
 * Used so the home screen and detail show "Settlements needed" only when there is still something to pay.
 */
export function getRemainingDebts(
  debts: Debt[],
  settlements: Settlement[],
  groupId: string
): Debt[] {
  const groupSettlements = settlements.filter(
    s => s.groupId === groupId && s.settled === true
  );
  const remaining: Debt[] = [];
  for (const debt of debts) {
    const settledTotal = groupSettlements
      .filter(s => s.from === debt.from && s.to === debt.to)
      .reduce((sum, s) => sum + s.amount, 0);
    const left = Math.round((debt.amount - settledTotal) * 100) / 100;
    if (left > 0.01) {
      remaining.push({ from: debt.from, to: debt.to, amount: left });
    }
  }
  return remaining;
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
