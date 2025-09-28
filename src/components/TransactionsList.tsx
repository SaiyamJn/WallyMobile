import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';

export function TransactionsList() {
  const { state, dispatch, convertAmount, formatCurrency } = useApp();
  const { alertState, hideAlert, showDeleteAlert } = useCustomAlert();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [localSelectedAccountId, setLocalSelectedAccountId] = useState<string | null>(state.selectedAccountId);

  // Use context selectedAccountId if available, otherwise use local state
  const selectedAccountId = state.selectedAccountId !== null ? state.selectedAccountId : localSelectedAccountId;

  const filteredTransactions = state.transactions
    .filter(t => {
      const typeMatch = filter === 'all' || t.type === filter;
      const accountMatch = !selectedAccountId || t.accountId === selectedAccountId;
      return typeMatch && accountMatch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDeleteTransaction = (id: string) => {
    console.log('Delete transaction clicked for ID:', id);
    
    showDeleteAlert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      () => {
        console.log('User confirmed deletion, dispatching DELETE_TRANSACTION for ID:', id);
        dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      }
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => dispatch({ type: 'SET_SCREEN', payload: 'add-transaction' })}
        >
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {/* Account Filter */}
      {state.accounts.length > 0 && (
        <View style={styles.accountFilterContainer}>
          <Text style={styles.accountFilterLabel}>Filter by Account:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.accountFilterScroll}
            contentContainerStyle={styles.accountFilterContent}
          >
            <TouchableOpacity
              style={[styles.accountFilterButton, !selectedAccountId && styles.accountFilterButtonActive]}
              onPress={() => {
                setLocalSelectedAccountId(null);
                dispatch({ type: 'SET_SELECTED_ACCOUNT', payload: null });
              }}
            >
              <Text style={[styles.accountFilterText, !selectedAccountId && styles.accountFilterTextActive]}>
                All Accounts
              </Text>
            </TouchableOpacity>
            {state.accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[styles.accountFilterButton, selectedAccountId === account.id && styles.accountFilterButtonActive]}
                onPress={() => {
                  setLocalSelectedAccountId(account.id);
                  dispatch({ type: 'SET_SELECTED_ACCOUNT', payload: account.id });
                }}
              >
                <Text style={styles.accountFilterIcon}>{account.icon}</Text>
                <Text style={[styles.accountFilterText, selectedAccountId === account.id && styles.accountFilterTextActive]}>
                  {account.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'income' && styles.filterButtonActive]}
          onPress={() => setFilter('income')}
        >
          <Text style={[styles.filterText, filter === 'income' && styles.filterTextActive]}>
            Income
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'expense' && styles.filterButtonActive]}
          onPress={() => setFilter('expense')}
        >
          <Text style={[styles.filterText, filter === 'expense' && styles.filterTextActive]}>
            Expense
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      {filteredTransactions.length > 0 ? (
        <View style={styles.transactionsList}>
          {filteredTransactions.map((transaction) => {
            const category = state.categories.find(c => c.name === transaction.category);
            const convertedAmount = convertAmount(
              transaction.amount,
              transaction.currency,
              state.currentCurrency.code
            );

            return (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionContent}>
                  <View style={styles.transactionLeft}>
                    <View 
                      style={[
                        styles.categoryIconContainer,
                        { backgroundColor: category?.color + '20' }
                      ]}
                    >
                      <Text style={styles.categoryIcon}>{category?.icon || '💰'}</Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>{transaction.description}</Text>
                      <Text style={styles.transactionCategory}>{transaction.category}</Text>
                      {transaction.accountId && (
                        <Text style={styles.transactionAccount}>
                          {state.accounts.find(a => a.id === transaction.accountId)?.name || 'Unknown Account'}
                        </Text>
                      )}
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[
                      styles.transactionAmount,
                      { color: transaction.type === 'income' ? '#10b981' : '#ef4444' }
                    ]}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(convertedAmount)}
                    </Text>
                    {transaction.currency !== state.currentCurrency.code && (
                      <Text style={styles.originalAmount}>
                        Original: {transaction.currency} {transaction.amount}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteTransaction(transaction.id)}
                    >
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No transactions found</Text>
          <Text style={styles.emptyText}>
            {filter === 'all' 
              ? "You haven't added any transactions yet."
              : `No ${filter} transactions found.`
            }
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => dispatch({ type: 'SET_SCREEN', payload: 'add-transaction' })}
          >
            <Text style={styles.emptyButtonText}>Add Your First Transaction</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
    marginTop:30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#202020ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 6,
    marginBottom: 24,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3e3e3eff',
  },
  filterText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 16,
  },
  filterTextActive: {
    color: '#ffffff',
  },
 scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Increased padding to prevent overlap with bottom navigation
    paddingTop: 50,
  },
  transactionsList: {
    gap: 15,
  },
  transactionCard: {
    backgroundColor: '#202020ff',
    borderRadius: 16,
    padding: 20,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  originalAmount: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 12,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: '#202020ff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  accountFilterContainer: {
    marginBottom: 16,
  },
  accountFilterLabel: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 12,
  },
  accountFilterScroll: {
    maxHeight: 50,
  },
  accountFilterContent: {
    paddingRight: 20,
  },
  accountFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202020ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  accountFilterButtonActive: {
    backgroundColor: '#3e3e3eff',
  },
  accountFilterIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  accountFilterText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  accountFilterTextActive: {
    color: '#ffffff',
  },
  transactionAccount: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
});