import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../contexts/AppContext';

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

  const balance = totalIncome - totalExpense;

  // Group transactions by date for daily view
  const transactionsByDate = state.transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .reduce((acc, transaction) => {
      const date = new Date(transaction.date).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transaction);
      return acc;
    }, {} as Record<string, typeof state.transactions>);

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${day} ${dayName} ${month.toString().padStart(2, '0')}.${year}`;
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = state.categories.find(c => c.name === categoryName);
    return category?.icon || '💰';
  };

  const getCategoryColor = (categoryName: string) => {
    const category = state.categories.find(c => c.name === categoryName);
    return category?.color || '#6b7280';
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
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.subtitle}>Here's your financial overview</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceTitleContainer}>
              <Text style={styles.walletIcon}>💰</Text>
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
              <Text style={styles.incomeIcon}>↗️</Text>
              <Text style={styles.statLabel}>Income</Text>
            </View>
            <Text style={styles.incomeAmount}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>

          <View style={[styles.statCard, styles.expenseCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.expenseIcon}>↘️</Text>
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
          /* Daily Transactions */
          Object.entries(transactionsByDate).map(([dateString, transactions]) => {
            const date = new Date(dateString);
            const dayIncome = transactions
              .filter(t => t.type === 'income')
              .reduce((sum, t) => {
                const convertedAmount = convertAmount(t.amount, t.currency, currentCurrency.code);
                return sum + convertedAmount;
              }, 0);
            const dayExpense = transactions
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => {
                const convertedAmount = convertAmount(t.amount, t.currency, currentCurrency.code);
                return sum + convertedAmount;
              }, 0);
            const dayTotal = dayIncome - dayExpense;

            return (
              <View key={dateString} style={styles.daySection}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayDate}>{formatDate(date)}</Text>
                  <View style={styles.dayAmounts}>
                    {dayIncome > 0 && (
                      <Text style={styles.dayIncome}>
                        +{formatCurrency(dayIncome)}
                      </Text>
                    )}
                    <Text style={[styles.dayTotal, { color: dayTotal >= 0 ? '#10b981' : '#ef4444' }]}>
                      {formatCurrency(Math.abs(dayTotal))}
                    </Text>
                  </View>
                </View>
                
                {transactions.map((transaction) => {
                  const convertedAmount = convertAmount(transaction.amount, transaction.currency, currentCurrency.code);
                  return (
                    <TouchableOpacity 
                      key={transaction.id} 
                      style={styles.transactionItem}
                      onPress={() => dispatch({ type: 'SET_SCREEN_WITH_TRANSACTION', payload: { screen: 'edit-transaction', transactionId: transaction.id } })}
                      activeOpacity={0.7}
                    >
                      <View style={styles.transactionLeft}>
                        <View style={[styles.categoryIconContainer, { backgroundColor: getCategoryColor(transaction.category) + '20' }]}>
                          <Text style={styles.categoryIcon}>{getCategoryIcon(transaction.category)}</Text>
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionCategory}>{transaction.category}</Text>
                          <Text style={styles.transactionDescription}>{transaction.description}</Text>
                          <Text style={styles.transactionType}>UP</Text>
                        </View>
                      </View>
                      <Text style={[styles.transactionAmount, { color: transaction.type === 'income' ? '#10b981' : '#ef4444' }]}>
                        {formatCurrency(convertedAmount)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })
        )}

      </ScrollView>

      {/* Floating Add Transaction Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => dispatch({ type: 'SET_SCREEN', payload: 'add-transaction' })}
      >
        <Text style={styles.floatingButtonIcon}>+</Text>
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
    gap: 10,
  },
  walletIcon: {
    fontSize: 18,
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
    gap: 14,
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
    gap: 10,
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
  daySection: {
    marginBottom: 20,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    marginBottom: 8,
  },
  dayDate: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  dayAmounts: {
    flexDirection: 'row',
    gap: 20,
  },
  dayIncome: {
    fontSize: 14,
    color: '#9ca3af',
  },
  dayTotal: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: 'bold',
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
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 18,
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