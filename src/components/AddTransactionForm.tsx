import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../contexts/AppContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';
import { categoryIconOptions } from '../utils/iconUtils';

export function AddTransactionForm() {
  const { state, dispatch, convertAmount, formatCurrency } = useApp();
  const { alertState, hideAlert, showErrorAlert, showConfirmAlert } = useCustomAlert();
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    accountId: ''
  });
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(formData.date));
  const [calendarViewDate, setCalendarViewDate] = useState(new Date(formData.date));
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: 'card' as string,
    color: '#3b82f6'
  });

  // Refs for input fields
  const amountInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);

  const categories = state.categories.filter(c => c.type === formData.type);

  // Calculate account balance from transactions (consistent with Accounts component)
  const getAccountBalanceFromTransactions = (accountId: string) => {
    const accountTransactions = state.transactions.filter(t => t.accountId === accountId);
    const currentCurrency = state.currentCurrency;
    
    return accountTransactions.reduce((sum, transaction) => {
      const convertedAmount = convertAmount(transaction.amount, transaction.currency, currentCurrency.code);
      return transaction.type === 'income' ? sum + convertedAmount : sum - convertedAmount;
    }, 0);
  };

  // Check if accounts exist when component loads
  useEffect(() => {
    if (state.accounts.length === 0) {
      showConfirmAlert(
        'No Accounts Found',
        'You need to create an account before adding transactions. Would you like to create one now?',
        () => dispatch({ type: 'SET_SCREEN', payload: 'accounts' }),
        () => dispatch({ type: 'GO_BACK' })
      );
    }
  }, []);

  // Sync selectedDate with formData.date
  useEffect(() => {
    setSelectedDate(new Date(formData.date));
    setCalendarViewDate(new Date(formData.date));
  }, [formData.date]);

  const handleCreateAccount = () => {
    dispatch({ type: 'SET_SCREEN', payload: 'accounts' });
  };

  // Navigation functions for automatic field progression
  const focusNextField = (fieldName: string) => {
    switch (fieldName) {
      case 'amount':
        // After amount, dismiss keyboard and open account selection
        amountInputRef.current?.blur();
        setTimeout(() => {
          setShowAccountModal(true);
        }, 100);
        break;
      case 'account':
        // After account selection, open category selection with small delay to ensure keyboard is dismissed
        setTimeout(() => {
          setShowCategoryModal(true);
        }, 150);
        break;
      case 'category':
        // After category selection, focus description
        setTimeout(() => {
          descriptionInputRef.current?.focus();
        }, 100);
        break;
      case 'description':
        // After description, submit the form
        handleSubmit();
        break;
    }
  };

  const handleAmountSubmit = () => {
    if (formData.amount && parseFloat(formData.amount) > 0) {
      focusNextField('amount');
    }
  };

  const handleSubmit = () => {
    if (!formData.amount || !formData.category) {
      showErrorAlert('Please fill in amount and category');
      return;
    }

    // For both income and expense transactions, require account selection
    if (!formData.accountId) {
      showErrorAlert('Please select an account for this transaction');
      return;
    }

    // Create a date with the selected date but current time
    // Parse date string as local midnight to avoid timezone issues
    const [year, month, day] = formData.date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day); // month is 0-indexed
    const now = new Date();
    const transactionDate = new Date(selectedDate);
    transactionDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

    const transaction = {
      id: Date.now().toString(),
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      description: formData.description,
      date: transactionDate.toISOString(), // Use selected date with current time
      currency: state.currentCurrency.code,
      accountId: formData.accountId
    };

    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
    
    // Update the account balance based on transaction type
    if (formData.accountId) {
      const amount = formData.type === 'income' 
        ? parseFloat(formData.amount) 
        : -parseFloat(formData.amount);
      
      dispatch({ 
        type: 'UPDATE_ACCOUNT_BALANCE', 
        payload: { 
          accountId: formData.accountId, 
          amount: amount
        } 
      });
    }
    
    // Reset form
    setFormData({
      amount: '',
      type: 'expense',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      accountId: ''
    });

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => dispatch({ type: 'GO_BACK' })}
        >
          <Icon name="back" size={ICON_SIZES.BACK_BUTTON} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Transaction</Text>
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
                ref={amountInputRef}
                style={styles.amountInput}
                value={formData.amount}
                onChangeText={(text) => handleInputChange('amount', text)}
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                returnKeyType="next"
                onSubmitEditing={handleAmountSubmit}
                blurOnSubmit={false}
              />
            </View>
          </View>

          {/* Account Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Account *</Text>
            <TouchableOpacity
              style={styles.selectionBox}
              onPress={() => setShowAccountModal(true)}
            >
              <View style={styles.selectionContent}>
                {formData.accountId ? (
                  <>
                    <View style={[styles.selectionIcon, { backgroundColor: state.accounts.find(a => a.id === formData.accountId)?.color }]}>
                      <Icon 
                        name={state.accounts.find(a => a.id === formData.accountId)?.icon || 'card'} 
                        size={ICON_SIZES.FORM_ACCOUNT} 
                        color="#ffffff" 
                      />
                    </View>
                    <Text style={styles.selectionText}>
                      {state.accounts.find(a => a.id === formData.accountId)?.name}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.selectionPlaceholder}>Select Account</Text>
                )}
              </View>
              <Text style={styles.selectionArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity
              style={styles.selectionBox}
              onPress={() => setShowCategoryModal(true)}
            >
              <View style={styles.selectionContent}>
                {formData.category ? (
                  <>
                    <Icon 
                      name={state.categories.find(c => c.name === formData.category)?.icon || 'card'} 
                      size={ICON_SIZES.FORM_CATEGORY} 
                    />
                    <Text style={styles.selectionText}>
                      {formData.category}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.selectionPlaceholder}>Select Category</Text>
                )}
              </View>
              <Text style={styles.selectionArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              ref={descriptionInputRef}
              style={styles.input}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Description (optional)"
              placeholderTextColor="#9ca3af"
              returnKeyType="done"
              onSubmitEditing={() => focusNextField('description')}
            />
          </View>


          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Add Transaction</Text>
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
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {state.accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.modalItem,
                    formData.accountId === account.id && styles.modalItemActive
                  ]}
                  onPressIn={() => {
                    handleInputChange('accountId', account.id);
                    setShowAccountModal(false);
                    // Dismiss any active keyboard and proceed to category selection
                    amountInputRef.current?.blur();
                    descriptionInputRef.current?.blur();
                    setTimeout(() => {
                      focusNextField('account');
                    }, 200);
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
              <TouchableOpacity
                style={styles.addAccountModalButton}
                onPress={() => {
                  setShowAccountModal(false);
                  handleCreateAccount();
                }}
              >
                <Text style={styles.addAccountModalButtonText}>+ Add New Account</Text>
              </TouchableOpacity>
            </ScrollView>
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
                    // Automatically proceed to description field
                    setTimeout(() => {
                      focusNextField('category');
                    }, 100);
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
                    
                    setTimeout(() => {
                      focusNextField('category');
                    }, 100);
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
    marginTop:30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#000000',
    gap: 12,
  },
  backButton: {
    marginRight: 16,
    marginTop:20,
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
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 120, // Increased padding to prevent overlap with bottom navigation
  },
  formCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginTop: 4,
  },
  dateContainer: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
    minWidth: 100,
    maxWidth: 120,
  },
  dateLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateInput: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 10,
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
  currencyNote: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  selectionBox: {
    backgroundColor: '#0f0f0f',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  selectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  selectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIconText: {
    fontSize: 14,
    color: '#ffffff',
  },
  selectionCategoryIcon: {
    fontSize: 20,
  },
  selectionText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  selectionPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  selectionArrow: {
    fontSize: 12,
    color: '#9ca3af',
  },
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
    backgroundColor: '#202020ff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  modalItemActive: {
    backgroundColor: '#3e3e3eff',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  modalItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemIconText: {
    fontSize: 16,
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
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  modalCategoryIcon: {
    fontSize: 24,
  },
  addAccountModalButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  addAccountModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  webDatePicker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -100 }],
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    width: 300,
    borderWidth: 1,
    borderColor: '#333333',
    zIndex: 1000,
  },
  webDatePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  webDateInput: {
    backgroundColor: '#0f0f0f',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  webDateButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  webDateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
  datePickerComponent: {
    width: 300,
    height: 200,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  datePickerInput: {
    backgroundColor: '#0f0f0f',
    borderRadius: 10,
    padding: 16,
    color: '#ffffff',
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#333333',
    width: '100%',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
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
  textArea: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#333333',
  },
  input: {
    backgroundColor: '#0f0f0f',
    borderRadius: 10,
    padding: 14,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
    fontWeight: '400',
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
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
    backgroundColor: '#202020ff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
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