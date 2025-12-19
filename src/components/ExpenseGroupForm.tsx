import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';
import { ExpenseGroup } from '../types';

export function ExpenseGroupForm() {
  const { state, dispatch } = useApp();
  const { alertState, hideAlert, showErrorAlert } = useCustomAlert();
  
  const isEditing = state.selectedExpenseGroupId !== null;

  // Use a ref to preserve form data when navigating away
  const formDataRef = useRef<{
    name: string;
    description: string;
    members: string[];
  } | null>(null);

  // Initialize form data only once
  const getInitialFormData = () => {
    // If we have preserved data, use it
    if (formDataRef.current) {
      return formDataRef.current;
    }
    
    // Otherwise, load from group if editing
    if (isEditing && state.selectedExpenseGroupId) {
      const group = state.expenseGroups.find(g => g.id === state.selectedExpenseGroupId);
      if (group) {
        return {
          name: group.name,
          description: group.description,
          members: [...group.members]
        };
      }
    }
    
    return { name: '', description: '', members: [] };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  // Update ref whenever formData changes
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Update form when people are added (to show new people in the list)
  // But preserve user's input for name and description
  useEffect(() => {
    if (isEditing && state.selectedExpenseGroupId) {
      const currentGroup = state.expenseGroups.find(g => g.id === state.selectedExpenseGroupId);
      
      if (currentGroup) {
        // Only update members if they changed (new person added to group)
        // Preserve name and description that user might have typed
        const currentMembers = formData.members;
        const groupMembers = currentGroup.members;
        
        // Check if members list changed
        const membersChanged = 
          groupMembers.length !== currentMembers.length ||
          groupMembers.some(id => !currentMembers.includes(id)) ||
          currentMembers.some(id => !groupMembers.includes(id));
        
        if (membersChanged) {
          // Update members but preserve name/description
          setFormData(prev => ({
            ...prev,
            members: [...groupMembers]
          }));
        }
      }
    } else if (!isEditing) {
      // When creating a new group, restore from ref if we navigated back
      if (formDataRef.current) {
        setFormData(formDataRef.current);
      }
    }
  }, [state.people.length, state.selectedExpenseGroupId]);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      showErrorAlert('Please enter a group name');
      return;
    }

    if (formData.members.length === 0) {
      showErrorAlert('Please add at least one member to the group');
      return;
    }

    if (isEditing && state.selectedExpenseGroupId) {
      // Re-fetch the group to ensure we have the latest data
      const currentGroup = state.expenseGroups.find(g => g.id === state.selectedExpenseGroupId);
      
      if (!currentGroup) {
        showErrorAlert('Group not found. Please try again.');
        return;
      }

      const updatedGroup: ExpenseGroup = {
        ...currentGroup,
        name: formData.name.trim(),
        description: formData.description.trim(),
        members: formData.members
      };
      dispatch({ type: 'UPDATE_EXPENSE_GROUP', payload: updatedGroup });
    } else {
      const newGroup: ExpenseGroup = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        members: formData.members,
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_EXPENSE_GROUP', payload: newGroup });
    }

    // Clear form data ref when submitting
    formDataRef.current = { name: '', description: '', members: [] };
    dispatch({ type: 'SET_SELECTED_EXPENSE_GROUP', payload: null });
    dispatch({ type: 'GO_BACK' });
  };

  const handleToggleMember = (personId: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(personId)
        ? prev.members.filter(id => id !== personId)
        : [...prev.members, personId]
    }));
  };

  const handleAddPerson = () => {
    // Preserve the selected group ID when navigating to add person
    // The PersonForm will navigate back and we'll still have the group selected
    dispatch({ type: 'SET_SCREEN', payload: 'add-person' });
  };

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            formDataRef.current = { name: '', description: '', members: [] };
            dispatch({ type: 'SET_SELECTED_EXPENSE_GROUP', payload: null });
            dispatch({ type: 'GO_BACK' });
          }}
          style={styles.backButton}
        >
          <Icon name="back" size={ICON_SIZES.ACTION} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edit Group' : 'New Group'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Trip to Paris"
            placeholderTextColor="#6b7280"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            autoFocus
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Optional description"
            placeholderTextColor="#6b7280"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Members *</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddPerson}
            >
              <Icon name="add" size={ICON_SIZES.SM} />
              <Text style={styles.addButtonText}>Add Person</Text>
            </TouchableOpacity>
          </View>
          
          {state.people.length === 0 ? (
            <View style={styles.emptyPeople}>
              <Text style={styles.emptyPeopleText}>
                No people added yet. Add people first to create a group.
              </Text>
              <TouchableOpacity 
                style={styles.emptyPeopleButton}
                onPress={handleAddPerson}
              >
                <Text style={styles.emptyPeopleButtonText}>Add Your First Person</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.membersList}>
              {state.people.map(person => {
                const isSelected = formData.members.includes(person.id);
                return (
                  <TouchableOpacity
                    key={person.id}
                    style={[
                      styles.memberItem,
                      isSelected && styles.memberItemSelected
                    ]}
                    onPress={() => handleToggleMember(person.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.memberLeft}>
                      <View style={[styles.memberIcon, { backgroundColor: person.color + '20' }]}>
                        <Icon name={person.icon as any} size={ICON_SIZES.SM} />
                      </View>
                      <Text style={styles.memberName}>{person.name}</Text>
                    </View>
                    {isSelected && (
                      <Icon name="success" size={ICON_SIZES.SM} color="#10b981" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Update Group' : 'Create Group'}
          </Text>
        </TouchableOpacity>
      </View>

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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  membersList: {
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  memberItemSelected: {
    borderColor: '#10b981',
    backgroundColor: '#10b98110',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  emptyPeople: {
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyPeopleText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyPeopleButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyPeopleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
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
