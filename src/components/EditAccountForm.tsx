import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Account } from '../types';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';
import { Icon } from './ui/Icon';
import { accountIconOptions } from '../utils/iconUtils';
import { ICON_SIZES } from '../constants/iconSizes';

const accountTypeOptions = [
  { value: 'trip', label: 'Trip', icon: 'plane' },
  { value: 'savings', label: 'Savings', icon: 'card' },
  { value: 'investment', label: 'Investment', icon: 'chart' },
  { value: 'other', label: 'Other', icon: 'popcorn' },
];

const colorOptions = [
  '#ed9149', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#06b6d4',
];

export function EditAccountForm() {
  const { state, dispatch } = useApp();
  const { alertState, hideAlert, showErrorAlert } = useCustomAlert();
  const account = state.accounts.find(a => a.id === state.selectedAccountId);

  const [formData, setFormData] = useState({
    name: '',
    type: 'other' as 'trip' | 'savings' | 'investment' | 'other',
    description: '',
    icon: 'card',
    color: '#ed9149',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        description: account.description || '',
        icon: account.icon,
        color: account.color,
      });
    }
  }, [account]);

  const handleSave = () => {
    if (!account) {
      showErrorAlert('Account not found');
      return;
    }
    if (!formData.name.trim()) {
      showErrorAlert('Please enter an account name');
      return;
    }

    const updated: Account = {
      ...account,
      name: formData.name.trim(),
      type: formData.type,
      description: formData.description.trim(),
      icon: formData.icon,
      color: formData.color,
    };
    dispatch({ type: 'UPDATE_ACCOUNT', payload: updated });
    dispatch({ type: 'GO_BACK' });
  };

  if (!account) {
    return null; // App will redirect when selectedAccountId is missing
  }

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
          <Text style={styles.title}>Edit Account</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          style={styles.formScrollView}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.form}>
            <Text style={styles.formTitle}>Account details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Account name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Type *</Text>
              <View style={styles.typeGrid}>
                {accountTypeOptions.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      formData.type === type.value && styles.typeButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, type: type.value })}
                  >
                    <Icon name={type.icon} size={ICON_SIZES.ICON_SELECTION} />
                    <Text
                      style={[
                        styles.typeText,
                        formData.type === type.value && styles.typeTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.textArea}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Description (optional)"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Icon</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                style={styles.iconSelector}
                contentContainerStyle={styles.iconScrollContent}
                bounces={false}
              >
                {accountIconOptions.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconButton,
                      formData.icon === icon && styles.iconButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, icon })}
                  >
                    <Icon name={icon} size={ICON_SIZES.ICON_SELECTION} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorRow}>
                {colorOptions.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      formData.color === color && styles.colorButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, color })}
                  />
                ))}
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => dispatch({ type: 'GO_BACK' })}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#202020ff',
    borderRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  formScrollView: {
    flex: 1,
  },
  formContent: {
    paddingBottom: 40,
  },
  form: {
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
  typeText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 6,
  },
  typeTextActive: {
    color: '#ffffff',
  },
  iconSelector: {
    flexGrow: 0,
  },
  iconScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: '#ffffff',
    transform: [{ scale: 1.1 }],
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
});
