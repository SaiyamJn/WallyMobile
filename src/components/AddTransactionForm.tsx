import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';

export function AddTransactionForm() {
  const { state, dispatch } = useApp();
  const { alertState, hideAlert, showErrorAlert } = useCustomAlert();
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    accountId: ''
  });

  const categories = state.categories.filter(c => c.type === formData.type);

  // Check if accounts exist when component loads
  useEffect(() => {
    if (state.accounts.length === 0) {
      Alert.alert(
        'No Accounts Found',
        'You need to create an account before adding transactions. Would you like to create one now?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => dispatch({ type: 'GO_BACK' })
          },
          {
            text: 'Create Account',
            onPress: () => dispatch({ type: 'SET_SCREEN', payload: 'accounts' })
          }
        ]
      );
    }
  }, []);

  const handleCreateAccount = () => {
    dispatch({ type: 'SET_SCREEN', payload: 'accounts' });
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

    const transaction = {
      id: Date.now().toString(),
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      description: formData.description,
      date: formData.date,
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => dispatch({ type: 'GO_BACK' })}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Transaction</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Transaction Details</Text>
          
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
                onPress={handleCreateAccount}
              >
                <Text style={styles.addAccountButtonText}>+ Add Account</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.accountGrid}>
              {state.accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountGridItem,
                    formData.accountId === account.id && styles.accountGridItemActive
                  ]}
                  onPress={() => handleInputChange('accountId', account.id)}
                >
                  <View style={[styles.accountIcon, { backgroundColor: account.color }]}>
                    <Text style={styles.accountIconText}>{account.icon}</Text>
                  </View>
                  <Text style={[
                    styles.accountText,
                    formData.accountId === account.id && styles.accountTextActive
                  ]}>
                    {account.name}
                  </Text>
                  <Text style={styles.accountBalance}>
                    {state.currentCurrency.symbol}{account.balance.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryGridItem,
                    formData.category === category.name && styles.categoryGridItemActive
                  ]}
                  onPress={() => handleInputChange('category', category.name)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryText,
                    formData.category === category.name && styles.categoryTextActive
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Description (optional)"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={formData.date}
              onChangeText={(text) => handleInputChange('date', text)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
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
    paddingHorizontal: 20,
    paddingBottom: 120, // Increased padding to prevent overlap with bottom navigation
  },
  formCard: {
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
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
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: '#3e3e3eff',
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
    marginRight: 12,
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
  accountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  accountGridItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#202020ff',
    borderRadius: 10,
    width: '48%', // 2 columns with some spacing
    minHeight: 80,
  },
  accountGridItemActive: {
    backgroundColor: '#3e3e3eff',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  accountIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  accountIconText: {
    fontSize: 16,
    color: '#ffffff',
  },
  accountText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
  },
  accountTextActive: {
    color: '#ffffff',
  },
  accountBalance: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  categoryGridItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 6,
    backgroundColor: '#202020ff',
    borderRadius: 10,
    width: '32%', // 3 columns with some spacing
    minHeight: 70,
  },
  categoryGridItemActive: {
    backgroundColor: '#3e3e3eff',
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#ffffff',
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
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333333',
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
});