import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../contexts/AppContext';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';


export function Reports() {
  const { state, convertAmount, formatCurrency, dispatch } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'income' | 'expenses'>('expenses');
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly' | 'period'>('monthly');
  const [showDropdown, setShowDropdown] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'weekly':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week
        return { start: startOfWeek, end: endOfWeek };
      
      case 'monthly':
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        return { start: monthStart, end: monthEnd };
      
      case 'yearly':
        const yearStart = new Date(currentMonth.getFullYear(), 0, 1);
        const yearEnd = new Date(currentMonth.getFullYear(), 11, 31);
        return { start: yearStart, end: yearEnd };
      
      case 'period':
        if (customStartDate && customEndDate) {
          return { start: customStartDate, end: customEndDate };
        }
        // Fallback to current month if no custom dates
        const fallbackStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const fallbackEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        return { start: fallbackStart, end: fallbackEnd };
      
      default:
        const defaultStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const defaultEnd = new Date(currentMonth.getMonth() + 1, 0);
        return { start: defaultStart, end: defaultEnd };
    }
  };

  const { start: periodStart, end: periodEnd } = getDateRange();
  
  // Filter transactions for selected period and account
  const periodTransactions = state.transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const dateMatch = transactionDate >= periodStart && transactionDate <= periodEnd;
    const accountMatch = !selectedAccountId || t.accountId === selectedAccountId;
    return dateMatch && accountMatch;
  });

  // Calculate totals
  const totalIncome = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + convertAmount(t.amount, t.currency, state.currentCurrency.code), 0);

  const totalExpense = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + convertAmount(t.amount, t.currency, state.currentCurrency.code), 0);

  // Calculate expense categories for pie chart
  const expenseCategories = state.categories
    .filter(c => c.type === 'expense')
    .map(category => {
      const categoryTransactions = periodTransactions.filter(
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
        percentage: totalExpense > 0 ? (total / totalExpense) * 100 : 0
      };
    })
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value);

  // Calculate income by account with categories
  const accountsToShow = selectedAccountId 
    ? state.accounts.filter(a => a.id === selectedAccountId)
    : state.accounts;
  
  const incomeByAccount = accountsToShow
    .map(account => {
      const accountTransactions = periodTransactions.filter(
        t => t.type === 'income' && t.accountId === account.id
      );
      const total = accountTransactions.reduce((sum, t) => {
        const convertedAmount = convertAmount(t.amount, t.currency, state.currentCurrency.code);
        return sum + convertedAmount;
      }, 0);

      // Get income categories for this account
      const accountIncomeCategories = state.categories
        .filter(c => c.type === 'income')
        .map(category => {
          const categoryTransactions = accountTransactions.filter(
            t => t.category === category.name
          );
          const categoryTotal = categoryTransactions.reduce((sum, t) => {
            const convertedAmount = convertAmount(t.amount, t.currency, state.currentCurrency.code);
            return sum + convertedAmount;
          }, 0);
          
          return {
            name: category.name,
            value: categoryTotal,
            icon: category.icon,
            color: category.color,
            percentage: total > 0 ? (categoryTotal / total) * 100 : 0
          };
        })
        .filter(c => c.value > 0)
        .sort((a, b) => b.value - a.value);
      
      return {
        name: account.name,
        value: total,
        icon: 'card',
        color: account.color || '#10b981',
        percentage: totalIncome > 0 ? (total / totalIncome) * 100 : 0,
        accountId: account.id,
        categories: accountIncomeCategories
      };
    })
    .filter(a => a.value > 0)
    .sort((a, b) => b.value - a.value);

  // Prepare data for pie chart
  const pieData = expenseCategories.map((category, index) => ({
    name: category.name,
    population: Math.round(category.value), // Ensure integer values
    color: category.color,
    legendFontColor: '#ffffff',
    legendFontSize: 12,
  }));

  // Fallback data for testing
  const testPieData = [
    {
      name: 'Food',
      population: 100,
      color: '#ef4444',
      legendFontColor: '#ffffff',
      legendFontSize: 12,
    },
    {
      name: 'Transport',
      population: 50,
      color: '#ed9149',
      legendFontColor: '#ffffff',
      legendFontSize: 12,
    }
  ];

  const formatMonthYear = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handlePeriodSelect = (period: 'weekly' | 'monthly' | 'yearly' | 'period') => {
    setSelectedPeriod(period);
    setShowDropdown(false);
    if (period === 'period') {
      setShowDatePicker(true);
      setDatePickerMode('start');
      setCalendarViewDate(new Date());
      setSelectedDate(new Date());
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    if (datePickerMode === 'start') {
      setCustomStartDate(date);
      setDatePickerMode('end');
      // Keep date picker open for end date selection
    } else {
      setCustomEndDate(date);
      setShowDatePicker(false);
    }
  };

  const handleMonthChange = (newDate: Date) => {
    setCalendarViewDate(newDate);
  };

  const renderCalendarDays = (viewDate: Date) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const dayNumber = i - firstDayOfWeek + 1;
      const currentDate = new Date(year, month, dayNumber);
      const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
      const isToday = isCurrentMonth && 
        currentDate.getDate() === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear();
      
      const isSelected = isCurrentMonth && 
        selectedDate.getDate() === currentDate.getDate() &&
        selectedDate.getMonth() === currentDate.getMonth() &&
        selectedDate.getFullYear() === currentDate.getFullYear();
      
      days.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.calendarDay,
            !isCurrentMonth && styles.calendarDayOtherMonth,
            isToday && styles.calendarDayToday,
            isSelected && styles.calendarDaySelected
          ]}
          onPress={() => {
            if (isCurrentMonth) {
              handleDateSelect(currentDate);
            }
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
          <Text style={[
            styles.calendarDayText,
            !isCurrentMonth && styles.calendarDayTextOtherMonth,
            isToday && styles.calendarDayTextToday,
            isSelected && styles.calendarDayTextSelected
          ]}>
            {currentDate.getDate()}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  const formatPeriodDisplay = () => {
    switch (selectedPeriod) {
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      case 'period':
        if (customStartDate && customEndDate) {
          return `${customStartDate.toLocaleDateString()} - ${customEndDate.toLocaleDateString()}`;
        }
        return 'Custom Period';
      default:
        return 'Monthly';
    }
  };

  const handleCategoryPress = (categoryName: string, type: 'income' | 'expense', accountId?: string) => {
    // Get ALL transactions for this category (not just period transactions)
    let categoryTransactions;
    
    if (type === 'income' && accountId) {
      // For income categories within an account, filter by both category and account
      categoryTransactions = state.transactions.filter(t => 
        t.type === 'income' && t.category === categoryName && t.accountId === accountId
      );
    } else {
      // For expense categories or general income categories
      categoryTransactions = state.transactions.filter(t => 
        t.type === type && t.category === categoryName
      );
    }
    
    dispatch({ 
      type: 'SET_SCREEN_WITH_CATEGORY', 
      payload: { 
        screen: 'category-transactions', 
        categoryName, 
        transactions: categoryTransactions 
      } 
    });
  };

  const handleAccountPress = (accountName: string, accountId: string) => {
    const accountTransactions = periodTransactions.filter(t => 
      t.type === 'income' && t.accountId === accountId
    );
    
    dispatch({ 
      type: 'SET_SCREEN_WITH_CATEGORY', 
      payload: { 
        screen: 'category-transactions', 
        categoryName: accountName, 
        transactions: accountTransactions 
      } 
    });
  };

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Header with month navigation */}
      <View style={styles.header}>
        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
            <Icon name="back" size={ICON_SIZES.ACTION} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{formatMonthYear(currentMonth)}</Text>
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
            <Icon name="forward" size={ICON_SIZES.ACTION} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity 
            style={styles.dropdownContainer}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownText}>{formatPeriodDisplay()}</Text>
            <Icon name="down" size={ICON_SIZES.ACTION} color="#ffffff" />
          </TouchableOpacity>
          
          {showDropdown && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => handlePeriodSelect('weekly')}
              >
                <Text style={styles.dropdownItemText}>Weekly</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => handlePeriodSelect('monthly')}
              >
                <Text style={styles.dropdownItemText}>Monthly</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => handlePeriodSelect('yearly')}
              >
                <Text style={styles.dropdownItemText}>Yearly</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => handlePeriodSelect('period')}
              >
                <Text style={styles.dropdownItemText}>Custom Period</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Account Filter */}
      {state.accounts.length > 1 && (
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
                onPress={() => setSelectedAccountId(null)}
              >
                <Text style={[styles.accountFilterText, !selectedAccountId && styles.accountFilterTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {state.accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[styles.accountFilterButton, selectedAccountId === account.id && styles.accountFilterButtonActive]}
                  onPress={() => setSelectedAccountId(account.id)}
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

      {/* Income/Expenses Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'income' && styles.tabButtonActive]}
          onPress={() => setActiveTab('income')}
        >
          <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActive]}>
            Income
          </Text>
          <Text style={styles.tabAmount}>
            {formatCurrency(totalIncome)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'expenses' && styles.tabButtonActive]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.tabTextActive]}>
            Expenses
          </Text>
          <Text style={styles.tabAmount}>
            {formatCurrency(totalExpense)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Distribution Chart */}
      {activeTab === 'expenses' && (
        <View style={styles.chartContainer}>
          <View style={styles.distributionChart}>
            <Text style={styles.chartTitle}>Expense Distribution</Text>
            <View style={styles.totalDisplay}>
              <Text style={styles.totalLabel}>Total Expenses</Text>
              <Text style={styles.totalAmount}>{formatCurrency(totalExpense)}</Text>
            </View>
            
            {/* Category bars */}
            <View style={styles.categoryBars}>
              {expenseCategories.map((category, index) => (
                <TouchableOpacity 
                  key={category.name} 
                  style={styles.categoryBar}
                  onPress={() => handleCategoryPress(category.name, 'expense')}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryBarHeader}>
                    <View style={styles.categoryBarLeft}>
                      <Icon name={category.icon} size={ICON_SIZES.SM} />
                      <Text style={styles.categoryBarName}>{category.name}</Text>
                    </View>
                    <Text style={styles.categoryBarAmount}>{formatCurrency(category.value)}</Text>
                  </View>
                  <View style={styles.categoryBarProgress}>
                    <View 
                      style={[
                        styles.categoryBarFill, 
                        { 
                          width: `${category.percentage}%`,
                          backgroundColor: category.color
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.categoryBarPercentage}>{category.percentage.toFixed(1)}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}


      {/* Income view */}
      {activeTab === 'income' && (
        <View style={styles.incomeContainer}>
          <Text style={styles.incomeTitle}>Income by Account</Text>
          <View style={styles.totalDisplay}>
            <Text style={styles.totalLabel}>Total Income</Text>
            <Text style={styles.totalAmount}>{formatCurrency(totalIncome)}</Text>
          </View>
          
          {/* Account cards */}
          {incomeByAccount.map((account, index) => (
            <View key={account.accountId} style={styles.accountCard}>
              <View style={styles.accountCardHeader}>
                <View style={styles.accountCardLeft}>
                  <Icon name={account.icon} size={ICON_SIZES.SM} />
                  <Text style={styles.accountCardName}>{account.name}</Text>
                </View>
                <Text style={styles.accountCardAmount}>{formatCurrency(account.value)}</Text>
              </View>
              
              {/* Categories within this account */}
              {account.categories.length > 0 && (
                <View style={styles.accountCategories}>
                  {account.categories.map((category, catIndex) => (
                    <TouchableOpacity 
                      key={`${account.accountId}-${category.name}`}
                      style={styles.categoryBar}
                      onPress={() => handleCategoryPress(category.name, 'income', account.accountId)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.categoryBarHeader}>
                        <View style={styles.categoryBarLeft}>
                          <Icon name={category.icon} size={ICON_SIZES.SM} />
                          <Text style={styles.categoryBarName}>{category.name}</Text>
                        </View>
                        <Text style={styles.categoryBarAmount}>{formatCurrency(category.value)}</Text>
                      </View>
                      <View style={styles.categoryBarProgress}>
                        <View 
                          style={[
                            styles.categoryBarFill, 
                            { 
                              width: `${category.percentage}%`,
                              backgroundColor: category.color
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.categoryBarPercentage}>{category.percentage.toFixed(1)}%</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* No Data State */}
      {periodTransactions.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="chart" size={ICON_SIZES.EMPTY_STATE} />
          <Text style={styles.emptyTitle}>No data</Text>
          <Text style={styles.emptyText}>
            Add transactions to see reports
          </Text>
        </View>
      )}


      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <Text style={styles.datePickerTitle}>
                Select {datePickerMode === 'start' ? 'Start' : 'End'} Date
              </Text>
              
              <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity
                    style={styles.calendarNavButton}
                    onPress={() => {
                      const newDate = new Date(calendarViewDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      handleMonthChange(newDate);
                    }}
                  >
                    <Text style={styles.calendarNavText}>‹</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.calendarMonthText}>
                    {calendarViewDate.toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.calendarNavButton}
                    onPress={() => {
                      const newDate = new Date(calendarViewDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      handleMonthChange(newDate);
                    }}
                  >
                    <Text style={styles.calendarNavText}>›</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.calendarGrid}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
                  ))}
                  
                  {renderCalendarDays(calendarViewDate)}
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.cancelDateButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelDateButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Dropdown Overlay */}
      {showDropdown && (
        <TouchableOpacity 
          style={styles.dropdownOverlay}
          onPress={() => setShowDropdown(false)}
          activeOpacity={1}
        />
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 1000,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginHorizontal: 16,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202020ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 12,
  },
  dropdownText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  dropdownIcon: {
    color: '#9ca3af',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#ef4444',
    transform: [{ scale: 1.02 }],
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabAmount: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  distributionChart: {
    backgroundColor: '#202020ff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  totalDisplay: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#333333',
  },
  totalLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  categoryBars: {
    gap: 16,
  },
  categoryBar: {
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  categoryBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryBarIcon: {
    fontSize: 18,
  },
  categoryBarName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  categoryBarAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  categoryBarProgress: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryBarPercentage: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
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
  // Income account card styles
  incomeContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  incomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: '#202020ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  accountCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  accountCardIcon: {
    fontSize: 20,
  },
  accountCardName: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  accountCardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  accountCategories: {
    gap: 12,
  },
  // Dropdown styles
  dropdownWrapper: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 20,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: '#202020ff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1001,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: 'transparent',
  },
  // Date picker styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  calendarContainer: {
    width: '100%',
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  calendarNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#404040',
  },
  calendarNavText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    gap: 4,
  },
  calendarDayHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    color: '#9ca3af',
    paddingVertical: 6,
    letterSpacing: 0.5,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    margin: 0.5,
    minHeight: 28,
  },
  calendarDayOtherMonth: {
    opacity: 0.2,
  },
  calendarDayToday: {
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#059669',
  },
  calendarDaySelected: {
    backgroundColor: '#ed9149',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  calendarDayText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  calendarDayTextOtherMonth: {
    color: '#6b7280',
  },
  calendarDayTextToday: {
    color: '#ffffff',
    fontWeight: '600',
  },
  calendarDayTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  cancelDateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#404040',
  },
  cancelDateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  // Account filter styles
  accountFilterContainer: {
    marginBottom: 16,
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
});