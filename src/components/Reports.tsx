import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useApp } from '../contexts/AppContext';

const { width } = Dimensions.get('window');

export function Reports() {
  const { state, convertAmount, formatCurrency } = useApp();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'income'>('overview');

  // Calculate date range
  const now = new Date();
  const daysAgo = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
  const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  // Filter transactions by timeframe
  const filteredTransactions = state.transactions.filter(t => 
    new Date(t.date) >= startDate
  );

  // Calculate comprehensive statistics
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + convertAmount(t.amount, t.currency, state.currentCurrency.code), 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + convertAmount(t.amount, t.currency, state.currentCurrency.code), 0);

  const netIncome = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;

  // Calculate average daily spending
  const dailyExpenses = totalExpense / daysAgo;
  const averageTransactionAmount = filteredTransactions.length > 0 
    ? (totalIncome + totalExpense) / filteredTransactions.length 
    : 0;

  // Calculate category breakdown for expenses
  const expenseCategories = state.categories
    .filter(c => c.type === 'expense')
    .map(category => {
      const categoryTransactions = filteredTransactions.filter(
        t => t.type === 'expense' && t.category === category.name
      );
      const total = categoryTransactions.reduce((sum, t) => {
        const convertedAmount = convertAmount(t.amount, t.currency, state.currentCurrency.code);
        return sum + convertedAmount;
      }, 0);
      
      return {
        name: category.name,
        value: total,
        icon: category.icon,
        color: category.color,
        count: categoryTransactions.length,
        percentage: totalExpense > 0 ? (total / totalExpense) * 100 : 0
      };
    })
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value);

  // Calculate income categories
  const incomeCategories = state.categories
    .filter(c => c.type === 'income')
    .map(category => {
      const categoryTransactions = filteredTransactions.filter(
        t => t.type === 'income' && t.category === category.name
      );
      const total = categoryTransactions.reduce((sum, t) => {
        const convertedAmount = convertAmount(t.amount, t.currency, state.currentCurrency.code);
        return sum + convertedAmount;
      }, 0);
      
      return {
        name: category.name,
        value: total,
        icon: category.icon,
        color: category.color,
        count: categoryTransactions.length,
        percentage: totalIncome > 0 ? (total / totalIncome) * 100 : 0
      };
    })
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value);

  // Calculate top spending categories
  const topExpenseCategory = expenseCategories[0];
  const topIncomeCategory = incomeCategories[0];

  const timeframeOptions = [
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
    { value: '1y', label: '1Y' },
  ];

  const tabOptions = [
    { value: 'overview', label: 'Overview', icon: '📊' },
    { value: 'expenses', label: 'Expenses', icon: '💸' },
    { value: 'income', label: 'Income', icon: '💰' },
  ];

  const renderProgressBar = (percentage: number, color: string) => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} />
    </View>
  );

  const renderOverviewTab = () => (
    <>
      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Savings Rate</Text>
          <Text style={[styles.metricValue, { color: savingsRate >= 0 ? '#10b981' : '#ef4444' }]}>
            {savingsRate.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Daily Average</Text>
          <Text style={styles.metricValue}>{formatCurrency(dailyExpenses)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Avg Transaction</Text>
          <Text style={styles.metricValue}>{formatCurrency(averageTransactionAmount)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Transactions</Text>
          <Text style={styles.metricValue}>{filteredTransactions.length}</Text>
        </View>
      </View>

      {/* Top Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Categories</Text>
        <View style={styles.topCategoriesCard}>
          {topExpenseCategory && (
            <View style={styles.topCategoryItem}>
              <View style={styles.topCategoryLeft}>
                <Text style={styles.topCategoryIcon}>{topExpenseCategory.icon}</Text>
                <View>
                  <Text style={styles.topCategoryName}>Top Expense</Text>
                  <Text style={styles.topCategorySubName}>{topExpenseCategory.name}</Text>
                </View>
              </View>
              <Text style={styles.topCategoryAmount}>{formatCurrency(topExpenseCategory.value)}</Text>
            </View>
          )}
          {topIncomeCategory && (
            <View style={styles.topCategoryItem}>
              <View style={styles.topCategoryLeft}>
                <Text style={styles.topCategoryIcon}>{topIncomeCategory.icon}</Text>
                <View>
                  <Text style={styles.topCategoryName}>Top Income</Text>
                  <Text style={styles.topCategorySubName}>{topIncomeCategory.name}</Text>
                </View>
              </View>
              <Text style={styles.topCategoryAmount}>{formatCurrency(topIncomeCategory.value)}</Text>
            </View>
          )}
        </View>
      </View>
    </>
  );

  const renderExpensesTab = () => (
    <>
      {/* Expense Categories with Progress Bars */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expense Breakdown</Text>
        <View style={styles.categoriesList}>
          {expenseCategories.map((category, index) => (
            <View key={category.name} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <View 
                  style={[styles.categoryColorDot, { backgroundColor: category.color }]}
                />
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>
                    {category.count} transaction{category.count !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.categoryRight}>
                <Text style={styles.categoryAmount}>
                  {formatCurrency(category.value)}
                </Text>
                <Text style={styles.categoryPercentage}>
                  {category.percentage.toFixed(1)}%
                </Text>
                {renderProgressBar(category.percentage, category.color)}
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  const renderIncomeTab = () => (
    <>
      {/* Income Categories with Progress Bars */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Income Breakdown</Text>
        <View style={styles.categoriesList}>
          {incomeCategories.map((category, index) => (
            <View key={category.name} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <View 
                  style={[styles.categoryColorDot, { backgroundColor: category.color }]}
                />
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>
                    {category.count} transaction{category.count !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.categoryRight}>
                <Text style={styles.categoryAmount}>
                  {formatCurrency(category.value)}
                </Text>
                <Text style={styles.categoryPercentage}>
                  {category.percentage.toFixed(1)}%
                </Text>
                {renderProgressBar(category.percentage, category.color)}
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );


  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Reports & Analytics</Text>
        <View style={styles.timeframeSelector}>
          {timeframeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.timeframeButton,
                timeframe === option.value && styles.timeframeButtonActive
              ]}
              onPress={() => setTimeframe(option.value as typeof timeframe)}
            >
              <Text style={[
                styles.timeframeText,
                timeframe === option.value && styles.timeframeTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabOptions.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.tabButton,
              activeTab === tab.value && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab(tab.value as typeof activeTab)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabText,
              activeTab === tab.value && styles.tabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryCards}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryIcon}>📈</Text>
            <Text style={styles.summaryLabel}>Total Income</Text>
          </View>
          <Text style={styles.incomeAmount}>
            {formatCurrency(totalIncome)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryIcon}>📉</Text>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
          </View>
          <Text style={styles.expenseAmount}>
            {formatCurrency(totalExpense)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryIcon}>💰</Text>
            <Text style={styles.summaryLabel}>Net Income</Text>
          </View>
          <Text style={[styles.netAmount, { color: netIncome >= 0 ? '#10b981' : '#ef4444' }]}>
            {formatCurrency(netIncome)}
          </Text>
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'expenses' && renderExpensesTab()}
      {activeTab === 'income' && renderIncomeTab()}

      {/* No Data State */}
      {filteredTransactions.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No data for this period</Text>
          <Text style={styles.emptyText}>
            Add some transactions to see your financial reports and analytics.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 50,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  timeframeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#202020ff',
    borderRadius: 12,
  },
  timeframeButtonActive: {
    backgroundColor: '#3e3e3eff',
  },
  timeframeText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  timeframeTextActive: {
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 6,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#3e3e3eff',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  summaryCards: {
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#202020ff',
    borderRadius: 16,
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#9ca3af',
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
  netAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  topCategoriesCard: {
    backgroundColor: '#202020ff',
    borderRadius: 16,
    padding: 20,
  },
  topCategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3e3e3eff',
  },
  topCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topCategoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  topCategoryName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  topCategorySubName: {
    fontSize: 14,
    color: '#9ca3af',
  },
  topCategoryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  categoriesList: {
    backgroundColor: '#202020ff',
    borderRadius: 16,
    padding: 20,
  },
  categoryItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3e3e3eff',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  progressBarContainer: {
    width: 100,
    height: 4,
    backgroundColor: '#3e3e3eff',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
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