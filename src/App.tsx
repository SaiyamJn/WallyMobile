  import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

function AppContent() {
  // Sample data for demonstration
  const transactions = [
    { id: '1', amount: 5000, type: 'income', category: 'Salary', description: 'Monthly salary' },
    { id: '2', amount: 45, type: 'expense', category: 'Food & Dining', description: 'Lunch at restaurant' },
    { id: '3', amount: 120, type: 'expense', category: 'Shopping', description: 'Groceries' }
  ];

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#000000" />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>WallyMobile</Text>
            <Text style={styles.subtitle}>Finance Manager</Text>
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              ${balance.toLocaleString()}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={[styles.statAmount, { color: '#10b981' }]}>
                +${totalIncome.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={[styles.statAmount, { color: '#ef4444' }]}>
                -${totalExpense.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.transactionsCard}>
            <Text style={styles.cardTitle}>Recent Transactions</Text>
            {transactions.slice(0, 5).map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.category}
                  </Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'income' ? '#10b981' : '#ef4444' }
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaProvider>
  );
}

export default function App() {
  return <AppContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  balanceCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  transactionsCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#9ca3af',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});