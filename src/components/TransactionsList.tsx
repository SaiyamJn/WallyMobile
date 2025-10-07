import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';
import { getCategoryIcon, getCategoryColor, formatDateHeader, formatTime } from '../utils/transactionUtils';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';

export function TransactionsList() {
  const { state, dispatch, convertAmount, formatCurrency } = useApp();
  const { alertState, hideAlert, showDeleteAlert } = useCustomAlert();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [localSelectedAccountId, setLocalSelectedAccountId] = useState<string | null>(state.selectedAccountId);

  // Use context selectedAccountId if available, otherwise use local state
  const selectedAccountId = state.selectedAccountId !== null ? state.selectedAccountId : localSelectedAccountId;

  // Filter and sort transactions with newest first (same as Dashboard)
  const filteredTransactions = state.transactions
    .filter(t => {
      const typeMatch = filter === 'all' || t.type === filter;
      const accountMatch = !selectedAccountId || t.accountId === selectedAccountId;
      return typeMatch && accountMatch;
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
    });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, typeof filteredTransactions>);

  // Get sorted dates (newest first)
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });


  const handleDeleteTransaction = (id: string) => {
    showDeleteAlert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      () => {
        // Find the transaction to get its account info
        const transaction = state.transactions.find(t => t.id === id);
        
        if (transaction && transaction.accountId) {
          // Calculate the amount to subtract from account balance
          const amountToSubtract = transaction.type === 'income' 
            ? -transaction.amount  // Subtract income
            : transaction.amount;  // Add back expense
          
          // Update account balance
          dispatch({ 
            type: 'UPDATE_ACCOUNT_BALANCE', 
            payload: { 
              accountId: transaction.accountId, 
              amount: amountToSubtract
            } 
          });
        }
        
        // Delete the transaction
        dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      }
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
          {state.accounts.length > 2 && (
            <Text style={styles.scrollHint}>← Swipe to see all accounts →</Text>
          )}
          <View style={styles.accountFilterWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={state.accounts.length > 2}
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
                <Icon name={account.icon} size={ICON_SIZES.SM} />
                <Text style={[styles.accountFilterText, selectedAccountId === account.id && styles.accountFilterTextActive]}>
                  {account.name}
                </Text>
              </TouchableOpacity>
            ))}
            </ScrollView>
          </View>
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
          {sortedDates.map((dateString) => (
            <View key={dateString} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{formatDateHeader(dateString)}</Text>
              {groupedTransactions[dateString].map((transaction) => {
                const convertedAmount = convertAmount(
                  transaction.amount,
                  transaction.currency,
                  state.currentCurrency.code
                );

                return (
                  <TouchableOpacity 
                    key={transaction.id} 
                    style={styles.transactionItem}
                    onPress={() => dispatch({ type: 'SET_SCREEN_WITH_TRANSACTION', payload: { screen: 'edit-transaction', transactionId: transaction.id } })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.transactionLeft}>
                      <View 
                        style={[
                          styles.categoryIconContainer,
                          { backgroundColor: getCategoryColor(transaction.category, state.categories) + '20' }
                        ]}
                      >
                        <Icon name={getCategoryIcon(transaction.category, state.categories)} size={ICON_SIZES.TRANSACTION} />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionCategory}>{transaction.category}</Text>
                        <Text style={styles.transactionDescription}>{transaction.description}</Text>
                        <Text style={styles.transactionTime}>
                          {formatTime(transaction.date)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionRight}>
                      <View style={styles.amountContainer}>
                        <Text style={[
                          styles.transactionAmount,
                          { color: transaction.type === 'income' ? '#10b981' : '#ef4444' }
                        ]}>
                          {formatCurrency(convertedAmount)}
                        </Text>
                        {transaction.currency !== state.currentCurrency.code && (
                          <Text style={styles.originalAmount}>
                            Original: {transaction.currency} {transaction.amount}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={(e) => {
                          e.stopPropagation(); // Prevent triggering the edit action
                          handleDeleteTransaction(transaction.id);
                        }}
                      >
                        <Icon name="delete" size={ICON_SIZES.ACTION} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="chart" size={ICON_SIZES.EMPTY_STATE} />
          <Text style={styles.emptyTitle}>No transactions found</Text>
          <Text style={styles.emptyText}>
            {filter === 'all' 
              ? "No transactions yet"
              : `No ${filter} transactions`
            }
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => dispatch({ type: 'SET_SCREEN', payload: 'add-transaction' })}
          >
            <Text style={styles.emptyButtonText}>Add Transaction</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
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
    marginBottom: 16,
    gap: 6,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3e3e3eff',
    transform: [{ scale: 1.02 }],
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 120, // Increased padding to prevent overlap with bottom navigation
    paddingTop: 50,
  },
  transactionsList: {
    gap: 0,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginVertical: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 1,
  },
  transactionDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 1,
  },
  transactionTime: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  originalAmount: {
    fontSize: 9,
    color: '#9ca3af',
    marginBottom: 0,
  },
  deleteButton: {
    padding: 6,
    backgroundColor: '#ef4444',
    borderRadius: 4,
    minWidth: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 8,
  },
  accountFilterWrapper: {
    position: 'relative',
  },
  accountFilterScroll: {
    maxHeight: 50,
  },
  accountFilterContent: {
    paddingRight: 20,
    paddingLeft: 4,
    gap: 12,
  },
  accountFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202020ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 1,
    gap: 12,
  },
  accountFilterButtonActive: {
    backgroundColor: '#3e3e3eff',
    transform: [{ scale: 1.02 }],
  },
  accountFilterIcon: {
    fontSize: 16,
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
  scrollHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 8,
  },
});