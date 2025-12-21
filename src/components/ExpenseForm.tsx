import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../contexts/AppContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';
import { Icon } from './ui/Icon';
import { PersonAvatar } from './ui/PersonAvatar';
import { ICON_SIZES } from '../constants/iconSizes';
import { Expense, Split } from '../types';

export function ExpenseForm() {
  const { state, dispatch, formatCurrency } = useApp();
  const { alertState, hideAlert, showErrorAlert } = useCustomAlert();
  
  const group = state.expenseGroups.find(g => g.id === state.selectedExpenseGroupId);
  const isEditing = state.selectedExpenseId !== null;
  const existingExpense = isEditing 
    ? state.expenses.find(e => e.id === state.selectedExpenseId)
    : null;

  const [formData, setFormData] = useState({
    paidBy: existingExpense?.paidBy || '',
    amount: existingExpense?.amount.toString() || '',
    description: existingExpense?.description || '',
    date: existingExpense?.date ? new Date(existingExpense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    splitType: (existingExpense?.splitType || 'equal') as 'equal' | 'custom' | 'percentage',
    participants: existingExpense?.splits.map(s => s.personId) || [] as string[],
    splits: existingExpense?.splits || [] as Split[]
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    formData.date ? new Date(formData.date + 'T00:00:00') : new Date()
  );

  useEffect(() => {
    if (existingExpense) {
      setFormData({
        paidBy: existingExpense.paidBy,
        amount: existingExpense.amount.toString(),
        description: existingExpense.description,
        date: new Date(existingExpense.date).toISOString().split('T')[0],
        splitType: existingExpense.splitType,
        participants: existingExpense.splits.map(s => s.personId),
        splits: existingExpense.splits
      });
    } else if (group && group.members.length > 0) {
      // Default to first member as payer and all members as participants
      setFormData(prev => ({
        ...prev,
        paidBy: group.members[0],
        participants: [...group.members]
      }));
    }
  }, [existingExpense, group]);

  // Get group members
  const groupMembers = group 
    ? state.people.filter(p => group.members.includes(p.id))
    : [];

  // Calculate splits when amount or participants change
  useEffect(() => {
    if (formData.amount && formData.participants.length > 0) {
      const amount = parseFloat(formData.amount);
      if (!isNaN(amount) && amount > 0) {
        if (formData.splitType === 'equal') {
          const splitAmount = amount / formData.participants.length;
          const newSplits: Split[] = formData.participants.map(personId => ({
            personId,
            amount: Math.round((splitAmount * 100)) / 100
          }));
          setFormData(prev => ({ ...prev, splits: newSplits }));
        } else if (formData.splitType === 'custom') {
          // Keep existing custom splits, or initialize with equal splits
          if (formData.splits.length === 0 || 
              formData.splits.some(s => !formData.participants.includes(s.personId))) {
            const splitAmount = amount / formData.participants.length;
            const newSplits: Split[] = formData.participants.map(personId => ({
              personId,
              amount: Math.round((splitAmount * 100)) / 100
            }));
            setFormData(prev => ({ ...prev, splits: newSplits }));
          }
        } else if (formData.splitType === 'percentage') {
          // Initialize with equal percentages
          const percentage = 100 / formData.participants.length;
          const newSplits: Split[] = formData.participants.map(personId => ({
            personId,
            amount: Math.round((amount * percentage / 100) * 100) / 100,
            percentage
          }));
          setFormData(prev => ({ ...prev, splits: newSplits }));
        }
      }
    }
  }, [formData.amount, formData.participants, formData.splitType]);

  const handleSubmit = () => {
    if (!formData.paidBy) {
      showErrorAlert('Please select who paid');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showErrorAlert('Please enter a valid amount');
      return;
    }

    if (formData.participants.length === 0) {
      showErrorAlert('Please select at least one participant');
      return;
    }

    if (formData.splits.length === 0) {
      showErrorAlert('Please configure the split');
      return;
    }

    // Validate splits sum to amount (with small tolerance for rounding)
    const totalSplit = formData.splits.reduce((sum, s) => sum + s.amount, 0);
    const amount = parseFloat(formData.amount);
    if (Math.abs(totalSplit - amount) > 0.01) {
      showErrorAlert(`Split amounts (${formatCurrency(totalSplit)}) must equal total amount (${formatCurrency(amount)})`);
      return;
    }

    const [year, month, day] = formData.date.split('-').map(Number);
    const expenseDate = new Date(year, month - 1, day);
    expenseDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());

    if (isEditing && existingExpense) {
      const updatedExpense: Expense = {
        ...existingExpense,
        paidBy: formData.paidBy,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        date: expenseDate.toISOString(),
        splitType: formData.splitType,
        splits: formData.splits
      };
      dispatch({ type: 'UPDATE_EXPENSE', payload: updatedExpense });
    } else {
      const newExpense: Expense = {
        id: Date.now().toString(),
        groupId: group!.id,
        paidBy: formData.paidBy,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        date: expenseDate.toISOString(),
        splitType: formData.splitType,
        splits: formData.splits,
        currency: state.currentCurrency.code,
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
    }

    dispatch({ type: 'SET_SELECTED_EXPENSE', payload: null });
    dispatch({ type: 'GO_BACK' });
  };

  const handleToggleParticipant = (personId: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(personId)
        ? prev.participants.filter(id => id !== personId)
        : [...prev.participants, personId],
      splits: prev.splits.filter(s => s.personId !== personId)
    }));
  };

  const handleSplitAmountChange = (personId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      splits: prev.splits.map(s => 
        s.personId === personId 
          ? { ...s, amount: numValue }
          : s
      )
    }));
  };

  const handleSplitPercentageChange = (personId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const amount = parseFloat(formData.amount) || 0;
    setFormData(prev => ({
      ...prev,
      splits: prev.splits.map(s => 
        s.personId === personId 
          ? { ...s, percentage: numValue, amount: Math.round((amount * numValue / 100) * 100) / 100 }
          : s
      )
    }));
  };

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Group not found</Text>
      </View>
    );
  }

  const amount = parseFloat(formData.amount) || 0;
  const totalSplit = formData.splits.reduce((sum, s) => sum + s.amount, 0);

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            dispatch({ type: 'SET_SELECTED_EXPENSE', payload: null });
            dispatch({ type: 'GO_BACK' });
          }}
          style={styles.backButton}
        >
          <Icon name="back" size={ICON_SIZES.ACTION} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edit Expense' : 'New Expense'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount *</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#6b7280"
            value={formData.amount}
            onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="What was this expense for?"
            placeholderTextColor="#6b7280"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {new Date(formData.date + 'T00:00:00').toLocaleDateString()}
            </Text>
            <Icon name="forward" size={ICON_SIZES.SM} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Paid By *</Text>
          <View style={styles.personSelector}>
            {groupMembers.map(person => (
              <TouchableOpacity
                key={person.id}
                style={[
                  styles.personOption,
                  formData.paidBy === person.id && styles.personOptionSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, paidBy: person.id }))}
                activeOpacity={0.7}
              >
                <View style={[styles.personIcon, { backgroundColor: person.color + '20' }]}>
                  <PersonAvatar icon={person.icon} size={32} />
                </View>
                <Text style={styles.personName}>{person.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Split Type</Text>
          <View style={styles.splitTypeSelector}>
            <TouchableOpacity
              style={[
                styles.splitTypeOption,
                formData.splitType === 'equal' && styles.splitTypeOptionSelected
              ]}
              onPress={() => setFormData(prev => ({ ...prev, splitType: 'equal' }))}
            >
              <Text style={[
                styles.splitTypeText,
                formData.splitType === 'equal' && styles.splitTypeTextSelected
              ]}>
                Equal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.splitTypeOption,
                formData.splitType === 'custom' && styles.splitTypeOptionSelected
              ]}
              onPress={() => setFormData(prev => ({ ...prev, splitType: 'custom' }))}
            >
              <Text style={[
                styles.splitTypeText,
                formData.splitType === 'custom' && styles.splitTypeTextSelected
              ]}>
                Custom
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.splitTypeOption,
                formData.splitType === 'percentage' && styles.splitTypeOptionSelected
              ]}
              onPress={() => setFormData(prev => ({ ...prev, splitType: 'percentage' }))}
            >
              <Text style={[
                styles.splitTypeText,
                formData.splitType === 'percentage' && styles.splitTypeTextSelected
              ]}>
                Percentage
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Participants *</Text>
          <View style={styles.participantsList}>
            {groupMembers.map(person => {
              const isSelected = formData.participants.includes(person.id);
              return (
                <TouchableOpacity
                  key={person.id}
                  style={[
                    styles.participantItem,
                    isSelected && styles.participantItemSelected
                  ]}
                  onPress={() => handleToggleParticipant(person.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.participantLeft}>
                    <View style={[styles.personIcon, { backgroundColor: person.color + '20' }]}>
                      <PersonAvatar icon={person.icon} size={32} />
                    </View>
                    <Text style={styles.personName}>{person.name}</Text>
                  </View>
                  {isSelected && (
                    <Icon name="success" size={ICON_SIZES.SM} color="#10b981" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {formData.participants.length > 0 && formData.splitType !== 'equal' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {formData.splitType === 'custom' ? 'Custom Amounts' : 'Percentages'}
            </Text>
            <View style={styles.splitsList}>
              {formData.splits
                .filter(s => formData.participants.includes(s.personId))
                .map(split => {
                  const person = state.people.find(p => p.id === split.personId);
                  return (
                    <View key={split.personId} style={styles.splitItem}>
                      <View style={styles.splitLeft}>
                        <View style={[styles.personIcon, { backgroundColor: person?.color + '20' }]}>
                          <PersonAvatar icon={person?.icon || 'av0'} size={32} />
                        </View>
                        <Text style={styles.personName}>{person?.name || 'Unknown'}</Text>
                      </View>
                      <View style={styles.splitInput}>
                        {formData.splitType === 'custom' ? (
                          <TextInput
                            style={styles.splitAmountInput}
                            value={split.amount.toString()}
                            onChangeText={(text) => handleSplitAmountChange(split.personId, text)}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor="#6b7280"
                          />
                        ) : (
                          <View style={styles.percentageInput}>
                            <TextInput
                              style={styles.splitAmountInput}
                              value={split.percentage?.toString() || ''}
                              onChangeText={(text) => handleSplitPercentageChange(split.personId, text)}
                              keyboardType="decimal-pad"
                              placeholder="0"
                              placeholderTextColor="#6b7280"
                            />
                            <Text style={styles.percentageSymbol}>%</Text>
                          </View>
                        )}
                        <Text style={styles.splitAmountDisplay}>
                          {formatCurrency(split.amount)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
            </View>
            <View style={styles.splitSummary}>
              <Text style={styles.splitSummaryText}>
                Total: {formatCurrency(totalSplit)} / {formatCurrency(amount)}
              </Text>
              {Math.abs(totalSplit - amount) > 0.01 && (
                <Text style={styles.splitSummaryError}>
                  Amounts don't match!
                </Text>
              )}
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Update Expense' : 'Add Expense'}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setSelectedDate(date);
              setFormData(prev => ({
                ...prev,
                date: date.toISOString().split('T')[0]
              }));
            }
          }}
        />
      )}

      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={hideAlert}
      />
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
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333333',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  personSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  personOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  personOptionSelected: {
    borderColor: '#ec9706',
    backgroundColor: '#ec970620',
  },
  personIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  splitTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  splitTypeOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  splitTypeOptionSelected: {
    backgroundColor: '#ec9706',
  },
  splitTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  splitTypeTextSelected: {
    color: '#ffffff',
  },
  participantsList: {
    gap: 8,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  participantItemSelected: {
    borderColor: '#10b981',
    backgroundColor: '#10b98110',
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  splitsList: {
    gap: 12,
  },
  splitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 12,
  },
  splitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  splitInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  splitAmountInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: '#ffffff',
    width: 80,
    textAlign: 'right',
  },
  percentageInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentageSymbol: {
    fontSize: 14,
    color: '#9ca3af',
  },
  splitAmountDisplay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    minWidth: 80,
    textAlign: 'right',
  },
  splitSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  splitSummaryText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  splitSummaryError: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#ec9706',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
