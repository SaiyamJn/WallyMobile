import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';
import { getCategoryIcon, getCategoryColor, formatDateHeader, formatTime, getMonthYearString, isTransactionInMonth, isTransactionBeforeMonth } from '../utils/transactionUtils';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';

export function TransactionsList() {
  const { state, dispatch, convertAmount, formatCurrency } = useApp();
  const { alertState, hideAlert, showDeleteAlert } = useCustomAlert();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [localSelectedAccountId, setLocalSelectedAccountId] = useState<string | null>(state.selectedAccountId);
  
  // Month selector state - default to current month
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Use context selectedAccountId if available, otherwise use local state
  const selectedAccountId = state.selectedAccountId !== null ? state.selectedAccountId : localSelectedAccountId;

  // Calculate carry forward balance (all transactions before selected month)
  const carryForwardBalance = state.transactions
    .filter(t => {
      const accountMatch = !selectedAccountId || t.accountId === selectedAccountId;
      return accountMatch && isTransactionBeforeMonth(t.date, selectedMonth, selectedYear);
    })
    .reduce((sum, t) => {
      const convertedAmount = convertAmount(t.amount, t.currency, state.currentCurrency.code);
      return sum + (t.type === 'income' ? convertedAmount : -convertedAmount);
    }, 0);

  // Filter and sort transactions with newest first (same as Dashboard)
  const filteredTransactions = state.transactions
    .filter(t => {
      const typeMatch = filter === 'all' || t.type === filter;
      const accountMatch = !selectedAccountId || t.accountId === selectedAccountId;
      const monthMatch = isTransactionInMonth(t.date, selectedMonth, selectedYear);
      return typeMatch && accountMatch && monthMatch;
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

  // Get first day of selected month for carry forward display
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).toDateString();
  
  // Check if we should show carry forward (only if there are transactions in the month or carry forward > 0)
  const shouldShowCarryForward = carryForwardBalance !== 0 || filteredTransactions.length > 0;

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


  const handleDeleteTransaction = (id: string) => {
    showDeleteAlert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      () => {
        // Note: Account balance is now calculated dynamically from transactions,
        // so we no longer need to update the stored balance field.
        
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
                onPress={() => {
                  setLocalSelectedAccountId(null);
                  dispatch({ type: 'SET_SELECTED_ACCOUNT', payload: null });
                }}
              >
                <Text style={[styles.accountFilterText, !selectedAccountId && styles.accountFilterTextActive]}>
                  All
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

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <View style={styles.filterPillWrapper}>
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
      </View>

      {/* Transactions List */}
      {(filteredTransactions.length > 0 || shouldShowCarryForward) ? (
        <View style={styles.transactionsList}>
          {/* Carry Forward Entry - Show at the start if there's a balance or transactions */}
          {shouldShowCarryForward && (
            <View style={styles.dateGroup}>
              <View style={[styles.transactionItem, styles.carryForwardItem]}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.categoryIconContainer, { backgroundColor: '#3b82f620' }]}>
                    <Icon name="balance" size={ICON_SIZES.TRANSACTION} />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionCategory}>Carry Forward</Text>
                    <Text style={styles.transactionDescription}>Balance from previous month</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <View style={styles.amountContainer}>
                    <Text style={[styles.transactionAmount, { color: carryForwardBalance >= 0 ? '#10b981' : '#ef4444' }]}>
                      {formatCurrency(carryForwardBalance)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          
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
              ? `No transactions for ${getMonthYearString(selectedMonth, selectedYear)}`
              : `No ${filter} transactions for ${getMonthYearString(selectedMonth, selectedYear)}`
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
    marginBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#202020ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 12,
    marginTop: 0,
    paddingHorizontal: 0,
    paddingTop: 2,
    paddingBottom: 2,
    overflow: 'visible',
  },
  filterPillWrapper: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 3,
  },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    borderRadius: 16,
    minHeight: 36,
  },
  filterButtonActive: {
    backgroundColor: '#10b981',
  },
  filterText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
 scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 120, // Increased padding to prevent overlap with bottom navigation
    paddingTop: 40,
  },
  transactionsList: {
    gap: 0,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginVertical: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
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
    marginBottom: 12,
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
  transactionAccount: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  monthSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
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
  carryForwardItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginVertical: 2,
  },
});