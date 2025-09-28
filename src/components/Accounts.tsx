import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Account } from '../types';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';
import { useCustomInputModal } from '../hooks/useCustomInputModal';
import { CustomInputModal } from './ui/CustomInputModal';

export function Accounts() {
  const { state, dispatch, formatCurrency } = useApp();
  const { alertState, hideAlert, showDeleteAlert, showErrorAlert } = useCustomAlert();
  const { modalState, showInputModal, hideInputModal } = useCustomInputModal();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'trip' as 'trip' | 'savings' | 'investment' | 'other',
    description: '',
    icon: '✈️',
    color: '#3b82f6' // Default color, not user-selectable
  });
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const [isAddingMoney, setIsAddingMoney] = useState(false);

  const accountTypeOptions = [
    { value: 'trip', label: 'Trip', icon: '✈️' },
    { value: 'savings', label: 'Savings', icon: '💳' },
    { value: 'investment', label: 'Investment', icon: '📊' },
    { value: 'other', label: 'Other', icon: '💳' },
  ];

  const iconOptions = ['✈️', '💳', '📊', '💳', '🏦', '💎', '🎯', '🚀', '⭐', '🔒', '💼', '🏠', '🎮', '📚', '🎨', '🎵'];


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
    setNewAccount({ name: '', type: 'trip', description: '', icon: '✈️', color: '#3b82f6' });
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

  const handleUpdateBalance = (accountId: string, amount: number) => {
    dispatch({ type: 'UPDATE_ACCOUNT_BALANCE', payload: { accountId, amount } });
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
            <Text style={styles.accountIcon}>{account.icon}</Text>
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
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.accountBalance}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(account.balance)}
        </Text>
      </View>

      <View style={styles.balanceActions}>
        <TouchableOpacity
          style={[styles.balanceButton, styles.addBalanceButton]}
          onPress={() => {
            setCurrentAccountId(account.id);
            setIsAddingMoney(true);
            showInputModal(
              'Add Money',
              'Enter amount to add:',
              '0.00',
              'numeric'
            );
          }}
        >
          <Text style={styles.buttonText}>+ Add</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.balanceButton, styles.subtractBalanceButton]}
          onPress={() => {
            setCurrentAccountId(account.id);
            setIsAddingMoney(false);
            showInputModal(
              'Remove Money',
              'Enter amount to remove:',
              '0.00',
              'numeric'
            );
          }}
        >
          <Text style={styles.buttonText}>- Remove</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => dispatch({ type: 'GO_BACK' })}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Accounts</Text>
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
                <Text style={styles.emptyIcon}>💳</Text>
                <Text style={styles.emptyTitle}>No accounts</Text>
                <Text style={styles.emptyText}>Create an account to start tracking</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.addButtonText}>+ Add Account</Text>
          </TouchableOpacity>
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
                  <Text style={styles.typeIcon}>{type.icon}</Text>
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
                {iconOptions.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconButton,
                      newAccount.icon === icon && styles.iconButtonActive
                    ]}
                    onPress={() => setNewAccount({...newAccount, icon})}
                  >
                    <Text style={styles.iconText}>{icon}</Text>
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
      
      <CustomInputModal
        visible={modalState.visible}
        title={modalState.title}
        message={modalState.message}
        placeholder={modalState.placeholder}
        keyboardType={modalState.keyboardType}
        onConfirm={(amount) => {
          if (currentAccountId && amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
            const value = parseFloat(amount);
            handleUpdateBalance(currentAccountId, isAddingMoney ? value : -value);
          }
          hideInputModal();
        }}
        onCancel={hideInputModal}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
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
  },
  accountIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  deleteIcon: {
    fontSize: 14,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 0,
    gap: 6,
  },
  balanceButton: {
    flex: 1,
    height: 40,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addBalanceButton: {
    backgroundColor: '#10b981',
  },
  subtractBalanceButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
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
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 24,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  iconButton: {
    padding: 16,
    marginRight: 12,
    backgroundColor: '#3e3e3eff',
    borderRadius: 12,
    minWidth: 56,
    alignItems: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#10b981',
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
