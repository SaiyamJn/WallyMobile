import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { getCategoryIcon, getCategoryColor, formatDate, getMonthYearString, isTransactionInMonth, isTransactionBeforeMonth } from '../utils/transactionUtils';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';

export function Dashboard() {
  const { state, dispatch, convertAmount, formatCurrency } = useApp();
  
  // Month selector state - default to current month
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Account selector state
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const currentCurrency = state.currentCurrency;

  // Calculate carry forward balance (all transactions before selected month, filtered by account)
  const carryForwardBalance = state.transactions
    .filter(t => {
      const accountMatch = !selectedAccountId || t.accountId === selectedAccountId;
      return accountMatch && isTransactionBeforeMonth(t.date, selectedMonth, selectedYear);
    })
    .reduce((sum, t) => {
      const convertedAmount = convertAmount(t.amount, t.currency, currentCurrency.code);
      return sum + (t.type === 'income' ? convertedAmount : -convertedAmount);
    }, 0);

  // Calculate totals in current currency for selected month, filtered by account
  const totalIncome = state.transactions
    .filter(t => {
      const accountMatch = !selectedAccountId || t.accountId === selectedAccountId;
      return accountMatch && t.type === 'income' && isTransactionInMonth(t.date, selectedMonth, selectedYear);
    })
    .reduce((sum, t) => {
      const convertedAmount = convertAmount(t.amount, t.currency, currentCurrency.code);
      return sum + convertedAmount;
    }, 0);

  const totalExpense = state.transactions
    .filter(t => {
      const accountMatch = !selectedAccountId || t.accountId === selectedAccountId;
      return accountMatch && t.type === 'expense' && isTransactionInMonth(t.date, selectedMonth, selectedYear);
    })
    .reduce((sum, t) => {
      const convertedAmount = convertAmount(t.amount, t.currency, currentCurrency.code);
      return sum + convertedAmount;
    }, 0);

  // Calculate balance based on account selection
  let balance: number;
  if (selectedAccountId) {
    // For specific account: use account balance at start of month + transactions
    const account = state.accounts.find(a => a.id === selectedAccountId);
    if (account) {
      // Calculate account balance at start of selected month
      const accountBalanceAtStart = state.transactions
        .filter(t => {
          return t.accountId === selectedAccountId && isTransactionBeforeMonth(t.date, selectedMonth, selectedYear);
        })
        .reduce((sum, t) => {
          const convertedAmount = convertAmount(t.amount, t.currency, account.currency);
          return sum + (t.type === 'income' ? convertedAmount : -convertedAmount);
        }, 0);
      
      // Convert to current currency
      const accountBalanceConverted = convertAmount(accountBalanceAtStart, account.currency, currentCurrency.code);
      balance = accountBalanceConverted + totalIncome - totalExpense;
    } else {
      balance = carryForwardBalance + totalIncome - totalExpense;
    }
  } else {
    // For all accounts: carry forward + income - expense
    balance = carryForwardBalance + totalIncome - totalExpense;
  }

  // Get the 5 most recent transactions for selected month and account, sorted with newest first
  const recentTransactions = state.transactions
    .filter(t => {
      const accountMatch = !selectedAccountId || t.accountId === selectedAccountId;
      return accountMatch && isTransactionInMonth(t.date, selectedMonth, selectedYear);
    })
    .sort((a, b) => {
      // Handle both full datetime and date-only formats
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      // If dates are the same, use transaction ID as tiebreaker (higher ID = newer)
      if (dateA === dateB) {
        return parseInt(b.id) - parseInt(a.id);
      }
      
      return dateB - dateA; // Newest first
    })
    .slice(0, 5);

  // Helper function to navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;
    
    if (direction === 'prev') {
      newMonth--;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };



  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/wallet.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Wally</Text>
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelectorContainer}>
          <TouchableOpacity
            style={styles.monthNavButton}
            onPress={() => navigateMonth('prev')}
          >
            <Text style={styles.monthNavText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.monthDisplay}>
            <Text style={styles.monthText}>{getMonthYearString(selectedMonth, selectedYear)}</Text>
          </View>
          <TouchableOpacity
            style={styles.monthNavButton}
            onPress={() => navigateMonth('next')}
          >
            <Text style={styles.monthNavText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceTitleContainer}>
              <Icon name="total_balance" size={ICON_SIZES.DASHBOARD_BALANCE} />
              <Text style={styles.balanceTitle}>Total Balance</Text>
            </View>
            <Text style={styles.currencyCode}>{currentCurrency.code}</Text>
          </View>
          <Text style={styles.balanceAmount}>
            {formatCurrency(balance)}
          </Text>
        </View>

        {/* Income & Expense Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.incomeCard]}>
            <View style={styles.statHeader}>
              <Icon name="income_arrow" size={ICON_SIZES.DASHBOARD_STAT} />
              <Text style={styles.statLabel}>Income</Text>
            </View>
            <Text style={styles.incomeAmount}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>

          <View style={[styles.statCard, styles.expenseCard]}>
            <View style={styles.statHeader}>
              <Icon name="expense_arrow" size={ICON_SIZES.DASHBOARD_STAT} />
              <Text style={styles.statLabel}>Expenses</Text>
            </View>
            <Text style={styles.expenseAmount}>
              {formatCurrency(totalExpense)}
            </Text>
          </View>
        </View>

        {/* Account Filter */}
        {state.accounts.length > 0 && (
          <View style={styles.accountFilterContainer}>
            <View style={styles.accountFilterPillWrapper}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={state.accounts.length > 2}
                style={styles.accountFilterScroll}
                contentContainerStyle={styles.accountFilterContent}
                bounces={false}
              >
                <TouchableOpacity
                  style={[styles.accountFilterButton, !selectedAccountId && styles.accountFilterButtonActive]}
                  onPress={() => setSelectedAccountId(null)}
                >
                  <Text style={[styles.accountFilterText, !selectedAccountId && styles.accountFilterTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                {state.accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[styles.accountFilterButton, selectedAccountId === account.id && styles.accountFilterButtonActive]}
                    onPress={() => setSelectedAccountId(account.id)}
                  >
                    <View style={styles.accountIconContainer}>
                      <Icon name={account.icon} size={16} />
                    </View>
                    <Text style={[styles.accountFilterText, selectedAccountId === account.id && styles.accountFilterTextActive]}>
                      {account.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Recent Transactions Heading */}
        <Text style={styles.sectionHeading}>Recent Transactions</Text>

        {/* Empty State */}
        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions for this month</Text>
            <Text style={styles.emptySubtext}>Add your first transaction to get started</Text>
          </View>
        ) : (
          /* Recent Transactions List */
          recentTransactions.map((transaction) => {
            const convertedAmount = convertAmount(transaction.amount, transaction.currency, currentCurrency.code);
            const transactionDate = new Date(transaction.date);
            
            return (
              <TouchableOpacity 
                key={transaction.id} 
                style={styles.transactionItem}
                onPress={() => dispatch({ type: 'SET_SCREEN_WITH_TRANSACTION', payload: { screen: 'edit-transaction', transactionId: transaction.id } })}
                activeOpacity={0.7}
              >
                <View style={styles.transactionLeft}>
                  <View style={[styles.categoryIconContainer, { backgroundColor: getCategoryColor(transaction.category, state.categories) + '20' }]}>
                    <Icon name={getCategoryIcon(transaction.category, state.categories)} size={ICON_SIZES.TRANSACTION} />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionCategory}>{transaction.category}</Text>
                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                    <Text style={styles.transactionDate}>{formatDate(transactionDate)}</Text>
                  </View>
                </View>
                <Text style={[styles.transactionAmount, { color: transaction.type === 'income' ? '#10b981' : '#ef4444' }]}>
                  {formatCurrency(convertedAmount)}
                </Text>
              </TouchableOpacity>
            );
          })
        )}

      </ScrollView>

      {/* Floating Add Transaction Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => dispatch({ type: 'SET_SCREEN', payload: 'add-transaction' })}
      >
        <Icon name="add" size={ICON_SIZES.FLOATING} color="#ffffff" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 16,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 50,
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceTitle: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  currencyCode: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#202020ff',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
  },
  incomeCard: {
    borderLeftColor: '#10b981',
  },
  expenseCard: {
    borderLeftColor: '#ef4444',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  incomeIcon: {
    fontSize: 18,
  },
  expenseIcon: {
    fontSize: 18,
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  incomeAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    marginTop: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 2,
  },
  transactionType: {
    fontSize: 12,
    color: '#9ca3af',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#9ca3af',
    marginBottom: 8,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  floatingButtonIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  monthSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
    gap: 0,
  },
  monthNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavText: {
    fontSize: 20,
    color: '#9ca3af',
    fontWeight: '600',
  },
  monthDisplay: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  accountFilterContainer: {
    marginBottom: 16,
    marginTop: 0,
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 4,
    overflow: 'visible',
  },
  accountFilterPillWrapper: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  accountFilterScroll: {
    overflow: 'visible',
  },
  accountFilterContent: {
    paddingRight: 0,
    paddingLeft: 0,
    paddingTop: 2,
    paddingBottom: 2,
    gap: 4,
    alignItems: 'center',
  },
  accountFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 5,
    minHeight: 36,
  },
  accountFilterButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  accountIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountFilterText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  accountFilterTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});