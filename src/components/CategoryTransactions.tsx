import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { getCategoryIcon, getCategoryColor, formatDateHeader, formatTime } from '../utils/transactionUtils';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';

interface CategoryTransactionsProps {
  categoryName: string;
  onBack: () => void;
}

export function CategoryTransactions({ 
  categoryName, 
  onBack
}: CategoryTransactionsProps) {
  const { state, convertAmount, formatCurrency, dispatch } = useApp();

  // Get ALL transactions for this category (not just current month)
  // Check if categoryName is actually an account name by looking for it in accounts
  const isAccountName = state.accounts.some(account => account.name === categoryName);
  
  let categoryTransactions = state.transactions.filter(t => {
    if (isAccountName) {
      // If it's an account name, filter by accountId
      const account = state.accounts.find(acc => acc.name === categoryName);
      return account && t.accountId === account.id && t.type === 'income';
    } else {
      // If it's a category name, filter by category
      return t.category === categoryName;
    }
  });

  // Sort transactions with newest first (same as TransactionsList)
  categoryTransactions = categoryTransactions.sort((a, b) => {
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
  const groupedTransactions = categoryTransactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, any[]>);

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );


  const handleEditTransaction = (transaction: any) => {
    // Navigate to edit-transaction screen with the selected transaction
    dispatch({ 
      type: 'SET_SCREEN_WITH_TRANSACTION', 
      payload: { 
        screen: 'edit-transaction', 
        transactionId: transaction.id 
      } 
    });
  };


  const getTotalForDate = (dateTransactions: any[]) => {
    return dateTransactions.reduce((sum, transaction) => {
      const convertedAmount = convertAmount(transaction.amount, transaction.currency, state.currentCurrency.code);
      return sum + convertedAmount;
    }, 0);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="back" size={ICON_SIZES.BACK_BUTTON} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{categoryName}</Text>
          <Text style={styles.headerSubtitle}>
            {categoryTransactions.length} transaction{categoryTransactions.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedDates.map((date) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{formatDateHeader(date)}</Text>
            
            {groupedTransactions[date].map((transaction) => {
              const convertedAmount = convertAmount(
                transaction.amount,
                transaction.currency,
                state.currentCurrency.code
              );

              return (
                <TouchableOpacity
                  key={transaction.id}
                  style={styles.transactionItem}
                  onPress={() => handleEditTransaction(transaction)}
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
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {categoryTransactions.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="chart" size={ICON_SIZES.EMPTY_STATE} />
            <Text style={styles.emptyTitle}>No transactions</Text>
            <Text style={styles.emptyText}>
              No transactions found for {categoryName}
            </Text>
          </View>
        )}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 20,
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
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
    lineHeight: 24,
  },
});
