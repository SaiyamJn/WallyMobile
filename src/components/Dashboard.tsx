import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { getCategoryIcon, getCategoryColor, formatDate } from '../utils/transactionUtils';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';

export function Dashboard() {
  const { state, dispatch, convertAmount, formatCurrency } = useApp();

  const currentCurrency = state.currentCurrency;

  // Calculate totals in current currency
  const totalIncome = state.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => {
      const convertedAmount = convertAmount(t.amount, t.currency, currentCurrency.code);
      return sum + convertedAmount;
    }, 0);

  const totalExpense = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => {
      const convertedAmount = convertAmount(t.amount, t.currency, currentCurrency.code);
      return sum + convertedAmount;
    }, 0);

  // Calculate total balance from all accounts (converted to current currency)
  const totalAccountBalance = state.accounts.reduce((sum, account) => {
    const convertedAmount = convertAmount(account.balance, account.currency, currentCurrency.code);
    return sum + convertedAmount;
  }, 0);

  // Use account balance as the primary balance, fallback to transaction calculation if no accounts
  const balance = state.accounts.length > 0 ? totalAccountBalance : (totalIncome - totalExpense);

  // Get the 5 most recent transactions, sorted with newest first
  const recentTransactions = state.transactions
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
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.subtitle}>Here's your financial overview</Text>
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

        {/* Recent Transactions Heading */}
        <Text style={styles.sectionHeading}>Recent Transactions</Text>

        {/* Empty State */}
        {state.transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
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
    alignItems: 'center',
    marginBottom: 32,
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
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '400',
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
    marginBottom: 24,
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
    marginBottom: 20,
    marginTop: 20,
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
});