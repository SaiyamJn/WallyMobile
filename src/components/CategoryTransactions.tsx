import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useApp } from '../contexts/AppContext';

const { width } = Dimensions.get('window');

interface CategoryTransactionsProps {
  categoryName: string;
  onBack: () => void;
}

export function CategoryTransactions({ 
  categoryName, 
  onBack
}: CategoryTransactionsProps) {
  const { state, convertAmount, formatCurrency, dispatch } = useApp();

  // Get current month data to filter transactions
  const currentMonth = new Date();
  const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const currentMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  // Get fresh transactions from state instead of using passed props
  const monthTransactions = state.transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
  });
  
  // Filter transactions for the current category/account
  // Check if categoryName is actually an account name by looking for it in accounts
  const isAccountName = state.accounts.some(account => account.name === categoryName);
  
  const categoryTransactions = monthTransactions.filter(t => {
    if (isAccountName) {
      // If it's an account name, filter by accountId
      const account = state.accounts.find(acc => acc.name === categoryName);
      return account && t.accountId === account.id && t.type === 'income';
    } else {
      // If it's a category name, filter by category
      // For income categories, we need to get the account context from the navigation
      // Since we're coming from an account card, we should filter by both category and account
      return t.category === categoryName && t.type === 'income';
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
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
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{categoryName}</Text>
          <Text style={styles.headerSubtitle}>
            {categoryTransactions.length} transaction{categoryTransactions.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sortedDates.map((date) => (
          <View key={date} style={styles.dateGroup}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateText}>{formatDate(date)}</Text>
              <Text style={styles.dateTotal}>
                {formatCurrency(getTotalForDate(groupedTransactions[date]))}
              </Text>
            </View>
            
            {groupedTransactions[date].map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionItem}
                onPress={() => handleEditTransaction(transaction)}
                activeOpacity={0.7}
              >
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionTime}>
                    {new Date(transaction.date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </Text>
                </View>
                <Text style={styles.transactionAmount}>
                  {formatCurrency(convertAmount(transaction.amount, transaction.currency, state.currentCurrency.code))}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {categoryTransactions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
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
  backButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
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
    paddingHorizontal: 20,
  },
  dateGroup: {
    marginTop: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dateTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 14,
    color: '#9ca3af',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
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
