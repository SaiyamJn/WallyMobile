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

  // Recent transactions (last 5)
  const recentTransactions = state.transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Calculate accounts total balance
  const accountsTotalBalance = state.accounts.reduce((sum, account) => {
    const convertedBalance = convertAmount(account.balance, account.currency, currentCurrency.code);
    return sum + convertedBalance;
  }, 0);

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

        {/* Accounts Section */}
        <View style={styles.accountsCard}>
          <View style={styles.accountsHeader}>
            <Text style={styles.cardTitle}>Accounts</Text>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => dispatch({ type: 'SET_SCREEN', payload: 'accounts' })}
            >
              <Text style={styles.manageButtonText}>Manage</Text>
            </TouchableOpacity>
          </View>
          
          {state.accounts.length > 0 ? (
            <>
              <View style={styles.accountsTotal}>
                <Text style={styles.accountsTotalLabel}>Total Balance</Text>
                <Text style={styles.accountsTotalAmount}>
                  {formatCurrency(accountsTotalBalance)}
                </Text>
              </View>
              
              <View style={styles.accountsList}>
                {state.accounts.slice(0, 3).map((account) => {
                  const convertedBalance = convertAmount(account.balance, account.currency, currentCurrency.code);
                  return (
                    <View key={account.id} style={styles.accountItem}>
                      <View style={styles.accountLeft}>
                        <View 
                          style={[styles.accountIconContainer, { backgroundColor: account.color + '20' }]}
                        >
                          <Text style={styles.accountIcon}>{account.icon}</Text>
                        </View>
                        <View style={styles.accountInfo}>
                          <Text style={styles.accountName}>{account.name}</Text>
                          <Text style={styles.accountType}>{account.type}</Text>
                        </View>
                      </View>
                      <Text style={styles.accountBalance}>
                        {formatCurrency(convertedBalance)}
                      </Text>
                    </View>
                  );
                })}
              </View>
              
              {state.accounts.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => dispatch({ type: 'SET_SCREEN', payload: 'accounts' })}
                >
                  <Text style={styles.viewAllText}>
                    View All {state.accounts.length} Accounts
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyAccountsState}>
              <Text style={styles.emptyAccountsText}>No accounts yet</Text>
              <TouchableOpacity
                style={styles.createAccountButton}
                onPress={() => dispatch({ type: 'SET_SCREEN', payload: 'accounts' })}
              >
                <Text style={styles.createAccountButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsCard}>
          <Text style={styles.cardTitle}>Recent Transactions</Text>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => {
              const category = state.categories.find(c => c.name === transaction.category);
              const convertedAmount = convertAmount(
                transaction.amount, 
                transaction.currency, 
                currentCurrency.code
              );
              
              return (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View style={styles.categoryIconContainer}>
                      <Text style={styles.categoryIcon}>{category?.icon || '💰'}</Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>{transaction.description}</Text>
                      <Text style={styles.transactionCategory}>{transaction.category}</Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[
                      styles.transactionAmount,
                      { color: transaction.type === 'income' ? '#10b981' : '#ef4444' }
                    ]}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(convertedAmount)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Start by adding your first transaction!</Text>
            </View>
          )}
        </View>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '400',
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIcon: {
    fontSize: 24,
  },
  balanceTitle: {
    fontSize: 20,
    color: '#000000',
    fontWeight: '600',
  },
  currencyCode: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000000',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#202020ff',
    borderRadius: 16,
    padding: 20,
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
    marginBottom: 12,
  },
  incomeIcon: {
    fontSize: 20,
  },
  expenseIcon: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  incomeAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  expenseAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  transactionsCard: {
    backgroundColor: '#202020ff',
    borderRadius: 20,
    padding: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#27262dff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#9ca3af',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
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
  accountsCard: {
    backgroundColor: '#202020ff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  accountsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  manageButton: {
    backgroundColor: '#3e3e3eff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manageButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  accountsTotal: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3e3e3eff',
  },
  accountsTotalLabel: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 8,
  },
  accountsTotalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  accountsList: {
    gap: 12,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountIcon: {
    fontSize: 18,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  viewAllButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewAllText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyAccountsState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyAccountsText: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 16,
  },
  createAccountButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createAccountButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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