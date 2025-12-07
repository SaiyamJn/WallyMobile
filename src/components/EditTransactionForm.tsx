import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../contexts/AppContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';
import { categoryIconOptions } from '../utils/iconUtils';

export function EditTransactionForm() {
  const { state, dispatch, convertAmount, formatCurrency } = useApp();
  const { alertState, hideAlert, showErrorAlert, showDeleteAlert } = useCustomAlert();
  
  // Find the transaction being edited
  const transaction = state.transactions.find(t => t.id === state.selectedTransactionId);
  
  // Calculate account balance from transactions (consistent with Accounts component)
  const getAccountBalanceFromTransactions = (accountId: string) => {
    const accountTransactions = state.transactions.filter(t => t.accountId === accountId);
    const currentCurrency = state.currentCurrency;
    
    return accountTransactions.reduce((sum, transaction) => {
      const convertedAmount = convertAmount(transaction.amount, transaction.currency, currentCurrency.code);
      return transaction.type === 'income' ? sum + convertedAmount : sum - convertedAmount;
    }, 0);
  };
  
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // Initialize with current date to prevent "Invalid Date"
    accountId: ''
  });
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: 'card' as string,
    color: '#3b82f6'
  });

  // Initialize form with transaction data
  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount.toString(),
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        accountId: transaction.accountId || ''
      });
      setSelectedDate(new Date(transaction.date));
      setCalendarViewDate(new Date(transaction.date));
    }
  }, [transaction]);

  // Sync selectedDate with formData.date changes
  useEffect(() => {
    setSelectedDate(new Date(formData.date));
    setCalendarViewDate(new Date(formData.date));
  }, [formData.date]);

  const categories = state.categories.filter(c => c.type === formData.type);

  const handleSubmit = () => {
    if (!formData.amount || !formData.category) {
      showErrorAlert('Please fill in amount and category');
      return;
    }

    if (!formData.accountId) {
      showErrorAlert('Please select an account for this transaction');
      return;
    }

    if (!transaction) {
      showErrorAlert('Transaction not found');
      return;
    }

    // Calculate the difference in amount for account balance update
    const oldAmount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
    const newAmount = formData.type === 'income' ? parseFloat(formData.amount) : -parseFloat(formData.amount);
    const amountDifference = newAmount - oldAmount;

    // Create a date with the selected date but preserve the original time if possible
    const selectedDate = new Date(formData.date);
    const originalDate = new Date(transaction.date);
    const transactionDate = new Date(selectedDate);
    
    // If the date changed, use current time; otherwise preserve original time
    if (selectedDate.toDateString() !== originalDate.toDateString()) {
      const now = new Date();
      transactionDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    } else {
      transactionDate.setHours(originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds(), originalDate.getMilliseconds());
    }

    const updatedTransaction = {
      ...transaction,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      description: formData.description,
      date: transactionDate.toISOString(), // Use selected date with appropriate time
      accountId: formData.accountId
    };

    dispatch({ type: 'UPDATE_TRANSACTION', payload: updatedTransaction });
    
    // Update account balance if there's a difference
    if (amountDifference !== 0) {
      dispatch({ 
        type: 'UPDATE_ACCOUNT_BALANCE', 
        payload: { 
          accountId: formData.accountId, 
          amount: amountDifference
        } 
      });
    }
    
    // Navigate back to previous screen
    dispatch({ type: 'GO_BACK' });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
      setFormData(prev => ({ 
        ...prev, 
        date: selectedDate.toISOString().split('T')[0] // Keep date-only for form display
      }));
    }
  };

  const handleDateSelect = (selectedDate: Date) => {
    // Create a date string in YYYY-MM-DD format
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    setSelectedDate(selectedDate);
    setFormData(prev => ({ 
      ...prev, 
      date: dateString
    }));
    // Don't close the picker - only update the selection
  };

  const handleMonthChange = (newDate: Date) => {
    setCalendarViewDate(newDate);
    // Don't update formData or close picker for month navigation
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderCalendarDays = (viewDate: Date) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    const days = [];
    const today = new Date();
    const selectedDateStr = selectedDate.toDateString();
    
    
    for (let i = 0; i < 42; i++) {
      // Calculate the actual day number for this position
      const dayNumber = i - firstDayOfWeek + 1;
      const currentDate = new Date(year, month, dayNumber);
      
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.toDateString() === today.toDateString();
      const isSelected = currentDate.toDateString() === selectedDateStr;
      
      
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
            // Create a clean date without timezone issues
            const cleanDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            handleDateSelect(cleanDate);
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

  const handleDelete = () => {
    if (!transaction) return;
    
    showDeleteAlert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      () => {
        // Calculate the amount to subtract from account balance
        const amountToSubtract = transaction.type === 'income' 
          ? -transaction.amount  // Subtract income
          : transaction.amount;  // Add back expense
        
        // Update account balance
        if (transaction.accountId) {
          dispatch({ 
            type: 'UPDATE_ACCOUNT_BALANCE', 
            payload: { 
              accountId: transaction.accountId, 
              amount: amountToSubtract
            } 
          });
        }
        
        // Delete the transaction
        dispatch({ type: 'DELETE_TRANSACTION', payload: transaction.id });
        dispatch({ type: 'GO_BACK' });
      }
    );
  };

  if (!transaction) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => dispatch({ type: 'GO_BACK' })}
          >
            <Icon name="back" size={ICON_SIZES.BACK_BUTTON} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Transaction Not Found</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Transaction not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => dispatch({ type: 'GO_BACK' })}
        >
          <Icon name="back" size={ICON_SIZES.BACK_BUTTON} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Transaction</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Icon name="delete" size={ICON_SIZES.ACTION} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Transaction Details</Text>
            <TouchableOpacity 
              style={styles.dateContainer}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dateLabel}>Date</Text>
              <Text style={styles.dateInput}>
                {formatDisplayDate(formData.date)}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Transaction Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Type *</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'expense' && styles.typeButtonActive
                ]}
                onPress={() => {
                  handleInputChange('type', 'expense');
                  handleInputChange('category', ''); // Reset category when type changes
                }}
              >
                <Text style={[
                  styles.typeButtonText,
                  formData.type === 'expense' && styles.typeButtonTextActive
                ]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'income' && styles.typeButtonActive
                ]}
                onPress={() => {
                  handleInputChange('type', 'income');
                  handleInputChange('category', ''); // Reset category when type changes
                }}
              >
                <Text style={[
                  styles.typeButtonText,
                  formData.type === 'income' && styles.typeButtonTextActive
                ]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.label}>Amount *</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>{state.currentCurrency.symbol}</Text>
              <TextInput
                style={styles.amountInput}
                value={formData.amount}
                onChangeText={(text) => handleInputChange('amount', text)}
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Account Selection */}
          <View style={styles.section}>
            <View style={styles.accountHeader}>
              <Text style={styles.label}>Account *</Text>
              <TouchableOpacity
                style={styles.addAccountButton}
                onPress={() => dispatch({ type: 'SET_SCREEN', payload: 'accounts' })}
              >
                <Text style={styles.addAccountButtonText}>+ Add Account</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.selectionBox}
              onPress={() => setShowAccountModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.selectionBoxText}>
                {formData.accountId ? 
                  state.accounts.find(a => a.id === formData.accountId)?.name || 'Select Account' 
                  : 'Select Account'
                }
              </Text>
              <Text style={styles.selectionBoxIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity
              style={styles.selectionBox}
              onPress={() => setShowCategoryModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.selectionBoxText}>
                {formData.category || 'Select Category'}
              </Text>
              <Text style={styles.selectionBoxIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Description (optional)"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Update Transaction</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />

      {/* Account Selection Modal */}
      {showAccountModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Account</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAccountModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {state.accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.modalItem,
                    formData.accountId === account.id && styles.modalItemActive
                  ]}
                  onPress={() => {
                    handleInputChange('accountId', account.id);
                    setShowAccountModal(false);
                  }}
                >
                  <View style={[styles.modalItemIcon, { backgroundColor: account.color }]}>
                    <Icon name={account.icon} size={ICON_SIZES.MODAL_ACCOUNT} color="#ffffff" />
                  </View>
                  <View style={styles.modalItemContent}>
                    <Text style={[
                      styles.modalItemText,
                      formData.accountId === account.id && styles.modalItemTextActive
                    ]}>
                      {account.name}
                    </Text>
                    <Text style={styles.modalItemSubtext}>
                      {formatCurrency(getAccountBalanceFromTransactions(account.id))}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.addAccountModalButton}
              onPress={() => {
                setShowAccountModal(false);
                dispatch({ type: 'SET_SCREEN', payload: 'accounts' });
              }}
            >
              <Text style={styles.addAccountModalButtonText}>+ Add New Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <View style={styles.modalHeaderButtons}>
                <TouchableOpacity
                  style={styles.modalAddButton}
                  onPress={() => {
                    setNewCategory({
                      name: '',
                      icon: 'card',
                      color: '#3b82f6'
                    });
                    setShowAddCategoryModal(true);
                  }}
                >
                  <Text style={styles.modalAddButtonText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowCategoryModal(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.modalItem,
                    formData.category === category.name && styles.modalItemActive
                  ]}
                  onPress={() => {
                    handleInputChange('category', category.name);
                    setShowCategoryModal(false);
                  }}
                >
                  <Icon name={category.icon} size={ICON_SIZES.MODAL_CATEGORY} />
                  <Text style={[
                    styles.modalItemText,
                    formData.category === category.name && styles.modalItemTextActive
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.addCategoryModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Category</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAddCategoryModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.addCategoryScrollView}
              contentContainerStyle={styles.addCategoryScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Category Name */}
              <View style={styles.addCategoryInputGroup}>
                <Text style={styles.addCategoryLabel}>Category Name *</Text>
                <TextInput
                  style={styles.addCategoryInput}
                  value={newCategory.name}
                  onChangeText={(text) => setNewCategory({...newCategory, name: text})}
                  placeholder="Category name"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Icon Selection */}
              <View style={styles.addCategoryInputGroup}>
                <Text style={styles.addCategoryLabel}>Icon</Text>
                <Text style={styles.addCategoryScrollHint}>← Swipe to see more icons →</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={true} 
                  style={styles.addCategoryIconSelector}
                  contentContainerStyle={styles.addCategoryIconScrollContent}
                  nestedScrollEnabled={true}
                  bounces={false}
                >
                  {categoryIconOptions.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.addCategoryIconButton,
                        newCategory.icon === icon && styles.addCategoryIconButtonActive
                      ]}
                      onPress={() => setNewCategory({...newCategory, icon})}
                    >
                      <Icon name={icon} size={ICON_SIZES.ICON_SELECTION} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Color Selection */}
              <View style={styles.addCategoryInputGroup}>
                <Text style={styles.addCategoryLabel}>Color</Text>
                <View style={styles.addCategoryColorSelector}>
                  {['#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#84cc16'].map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.addCategoryColorButton,
                        { backgroundColor: color },
                        newCategory.color === color && styles.addCategoryColorButtonActive
                      ]}
                      onPress={() => setNewCategory({...newCategory, color})}
                    />
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.addCategoryActionButtons}>
                <TouchableOpacity
                  style={styles.addCategoryCancelButton}
                  onPress={() => setShowAddCategoryModal(false)}
                >
                  <Text style={styles.addCategoryCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addCategorySaveButton}
                  onPress={() => {
                    if (!newCategory.name.trim()) {
                      showErrorAlert('Please enter a category name');
                      return;
                    }

                    const category = {
                      id: Date.now().toString(),
                      name: newCategory.name.trim(),
                      type: formData.type,
                      icon: newCategory.icon,
                      color: newCategory.color
                    };

                    dispatch({ type: 'ADD_CATEGORY', payload: category });
                    handleInputChange('category', category.name);
                    setShowAddCategoryModal(false);
                    setShowCategoryModal(false);
                    setNewCategory({ name: '', icon: 'card', color: '#3b82f6' });
                  }}
                >
                  <Text style={styles.addCategorySaveButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select Date</Text>
              <TouchableOpacity
                style={styles.datePickerCloseButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContent}>
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
                    {calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
                style={styles.datePickerConfirmButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerConfirmText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#000000',
    gap: 12,
  },
  backButton: {
    marginRight: 16,
    marginTop: 20,
    padding: 10,
    backgroundColor: '#202020ff',
    borderRadius: 12,
  },
  backIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  deleteButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#ef4444',
    borderRadius: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#9ca3af',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  formCard: {
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  dateContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 8,
    minWidth: 100,
    maxWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  dateLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 4,
    fontWeight: '500',
  },
  dateInput: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 6,
    gap: 6,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: '#3e3e3eff',
    transform: [{ scale: 1.02 }],
  },
  typeButtonText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 16,
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  currencySymbol: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
  },
  amountInput: {
    flex: 1,
    paddingVertical: 16,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addAccountButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addAccountButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectionBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectionBoxText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  selectionBoxIcon: {
    color: '#9ca3af',
    fontSize: 12,
    marginLeft: 8,
  },
  textArea: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalCloseButton: {
    padding: 8,
    backgroundColor: '#333333',
    borderRadius: 20,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#ffffff',
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    gap: 12,
  },
  modalItemActive: {
    backgroundColor: '#3e3e3eff',
  },
  modalItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemIconText: {
    fontSize: 18,
    color: '#ffffff',
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  modalItemTextActive: {
    color: '#10b981',
  },
  modalItemSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  modalCategoryIcon: {
    fontSize: 24,
  },
  addAccountModalButton: {
    backgroundColor: '#10b981',
    margin: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addAccountModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Date picker styles
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  datePickerCloseButton: {
    padding: 8,
    backgroundColor: '#333333',
    borderRadius: 20,
  },
  datePickerCloseText: {
    fontSize: 16,
    color: '#ffffff',
  },
  datePickerContent: {
    alignItems: 'center',
  },
  calendarContainer: {
    width: 320,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarDayHeader: {
    width: '14.28%',
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginVertical: 2,
    minHeight: 40,
    minWidth: 40,
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayToday: {
    backgroundColor: '#e3f2fd',
  },
  calendarDaySelected: {
    backgroundColor: '#10b981',
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  calendarDayTextOtherMonth: {
    color: '#999999',
  },
  calendarDayTextToday: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  calendarDayTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  datePickerConfirmButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  datePickerConfirmText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  modalAddButton: {
    padding: 8,
    backgroundColor: '#10b981',
    borderRadius: 20,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAddButtonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  addCategoryModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333333',
    padding: 20,
  },
  addCategoryScrollView: {
    maxHeight: 500,
  },
  addCategoryScrollContent: {
    paddingBottom: 20,
  },
  addCategoryInputGroup: {
    marginBottom: 24,
  },
  addCategoryLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 12,
    fontWeight: '600',
  },
  addCategoryInput: {
    backgroundColor: '#3e3e3eff',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  addCategoryScrollHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  addCategoryIconSelector: {
    marginTop: 12,
    height: 80,
    width: '100%',
  },
  addCategoryIconScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
    gap: 12,
  },
  addCategoryIconButton: {
    padding: 16,
    backgroundColor: '#3e3e3eff',
    borderRadius: 12,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCategoryIconButtonActive: {
    backgroundColor: '#10b981',
    transform: [{ scale: 1.1 }],
  },
  addCategoryColorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  addCategoryColorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  addCategoryColorButtonActive: {
    borderColor: '#ffffff',
  },
  addCategoryActionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  addCategoryCancelButton: {
    flex: 1,
    backgroundColor: '#3e3e3eff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  addCategoryCancelButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addCategorySaveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  addCategorySaveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
