import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Account } from '../types';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';
import { Icon } from './ui/Icon';
import { accountIconOptions, getEmojiFallback } from '../utils/iconUtils';
import { ICON_SIZES } from '../constants/iconSizes';

export function Accounts() {
  const { state, dispatch, formatCurrency, convertAmount } = useApp();
  const { alertState, hideAlert, showDeleteAlert, showErrorAlert } = useCustomAlert();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'trip' as 'trip' | 'savings' | 'investment' | 'other',
    description: '',
    icon: 'plane',
    color: '#3b82f6' // Default color, not user-selectable
  });

  const accountTypeOptions = [
    { value: 'trip', label: 'Trip', icon: 'plane' },
    { value: 'savings', label: 'Savings', icon: 'card' },
    { value: 'investment', label: 'Investment', icon: 'chart' },
    { value: 'other', label: 'Other', icon: 'popcorn' },
  ];


  const handleAddAccount = () => {
    if (!newAccount.name.trim()) {
      showErrorAlert('Please enter an account name');
      return;
    }

    const account: Account = {
      id: Date.now().toString(),
      name: newAccount.name.trim(),
      type: newAccount.type,
      description: newAccount.description.trim(),
      icon: newAccount.icon,
      color: newAccount.color,
      balance: 0,
      currency: state.currentCurrency.code,
      createdAt: new Date().toISOString()
    };

    dispatch({ type: 'ADD_ACCOUNT', payload: account });
    setNewAccount({ name: '', type: 'trip', description: '', icon: 'plane', color: '#3b82f6' });
    setShowAddForm(false);
  };

  const handleDeleteAccount = (id: string) => {
    const account = state.accounts.find(a => a.id === id);
    
    if (account && account.balance !== 0) {
      showErrorAlert('This account has a non-zero balance. Please transfer or clear the balance first.');
      return;
    }

    showDeleteAlert(
      'Delete Account',
      'Are you sure you want to delete this account?',
      () => dispatch({ type: 'DELETE_ACCOUNT', payload: id })
    );
  };


  // Calculate account balance from transactions
  const getAccountBalanceFromTransactions = (accountId: string) => {
    const accountTransactions = state.transactions.filter(t => t.accountId === accountId);
    const currentCurrency = state.currentCurrency;
    
    return accountTransactions.reduce((sum, transaction) => {
      const convertedAmount = convertAmount(transaction.amount, transaction.currency, currentCurrency.code);
      return transaction.type === 'income' ? sum + convertedAmount : sum - convertedAmount;
    }, 0);
  };

  const renderAccountItem = (account: Account) => (
    <TouchableOpacity
      key={account.id}
      style={styles.accountCard}
      onPress={() => {
        // Navigate to transactions with this account filtered
        dispatch({ type: 'SET_SCREEN_WITH_ACCOUNT', payload: { screen: 'transactions', accountId: account.id } });
      }}
      activeOpacity={0.7}
    >
      <View style={styles.accountHeader}>
        <View style={styles.accountLeft}>
          <View 
            style={[styles.accountIconContainer, { backgroundColor: account.color + '20' }]}
          >
            <Icon name={account.icon} size={ICON_SIZES.ACCOUNT} />
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{account.name}</Text>
            <Text style={styles.accountType}>{accountTypeOptions.find(t => t.value === account.type)?.label}</Text>
            {account.description && (
              <Text style={styles.accountDescription}>{account.description}</Text>
            )}
          </View>
        </View>
        <View style={styles.accountRight}>
          <Text style={styles.viewTransactionsHint}>View Transactions →</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent card click when deleting
              handleDeleteAccount(account.id);
            }}
          >
            <Icon name="delete" size={ICON_SIZES.ACTION} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.accountBalance}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(getAccountBalanceFromTransactions(account.id))}
        </Text>
      </View>

      <View style={styles.balanceActions}>
        <Text style={styles.balanceNote}>
          Balance calculated from transactions
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => dispatch({ type: 'GO_BACK' })}
          >
            <Icon name="back" size={ICON_SIZES.BACK_BUTTON} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Accounts</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

      {!showAddForm ? (
        <>
          {/* Accounts List */}
          <View style={styles.section}>
            {state.accounts.length > 0 ? (
              <View style={styles.accountsList}>
                {state.accounts.map(renderAccountItem)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="card" size={ICON_SIZES.EMPTY_STATE} />
                <Text style={styles.emptyTitle}>No accounts</Text>
                <Text style={styles.emptyText}>Create an account to start tracking</Text>
              </View>
            )}
          </View>

        </>
      ) : (
        <ScrollView 
          style={styles.addFormScrollView}
          contentContainerStyle={styles.addFormContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.addForm}>
          <Text style={styles.formTitle}>Add Account</Text>
          
          {/* Account Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Name *</Text>
            <TextInput
              style={styles.input}
              value={newAccount.name}
              onChangeText={(text) => setNewAccount({...newAccount, name: text})}
              placeholder="Account name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Account Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Type *</Text>
            <View style={styles.typeGrid}>
              {accountTypeOptions.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    newAccount.type === type.value && styles.typeButtonActive
                  ]}
                  onPress={() => setNewAccount({...newAccount, type: type.value as any})}
                >
                  <Icon name={type.icon} size={ICON_SIZES.ICON_SELECTION} />
                  <Text style={[
                    styles.typeText,
                    newAccount.type === type.value && styles.typeTextActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={newAccount.description}
              onChangeText={(text) => setNewAccount({...newAccount, description: text})}
              placeholder="Description (optional)"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Icon Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Icon</Text>
            <View style={styles.iconContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={true} 
                style={styles.iconSelector}
                contentContainerStyle={styles.iconScrollContent}
                nestedScrollEnabled={true}
                bounces={false}
                scrollEventThrottle={16}
              >
                {accountIconOptions.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconButton,
                      newAccount.icon === icon && styles.iconButtonActive
                    ]}
                    onPress={() => setNewAccount({...newAccount, icon})}
                  >
                    <Icon name={icon} size={ICON_SIZES.ICON_SELECTION} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>


          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddForm(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddAccount}
            >
              <Text style={styles.saveButtonText}>Add Account</Text>
            </TouchableOpacity>
          </View>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
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
  accountsList: {
    gap: 16,
  },
  accountCard: {
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  accountIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountIcon: {
    fontSize: 18,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 3,
  },
  accountType: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  accountDescription: {
    fontSize: 10,
    color: '#6b7280',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountBalance: {
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#3e3e3eff',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  balanceActions: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 0,
  },
  balanceNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
    backgroundColor: '#10b981',
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 18,
    color: '#ffffff',
  },
  addFormScrollView: {
    flex: 1,
  },
  addFormContent: {
    paddingBottom: 100, // Extra padding to ensure buttons are accessible
  },
  addForm: {
    backgroundColor: '#202020ff',
    borderRadius: 20,
    padding: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#3e3e3eff',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#3e3e3eff',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 80,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#3e3e3eff',
    borderRadius: 12,
  },
  typeButtonActive: {
    backgroundColor: '#10b981',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 14,
  },
  typeTextActive: {
    color: '#ffffff',
  },
  iconContainer: {
    marginTop: 12,
    height: 80,
    width: '100%',
  },
  iconSelector: {
    flex: 1,
  },
  iconScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
    gap: 12,
  },
  iconButton: {
    padding: 16,
    backgroundColor: '#3e3e3eff',
    borderRadius: 12,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#10b981',
    transform: [{ scale: 1.1 }],
  },
  iconText: {
    fontSize: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#3e3e3eff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  accountRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  viewTransactionsHint: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
});
