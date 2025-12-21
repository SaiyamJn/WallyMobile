import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';
import { Person } from '../types';
import { avatarOptions, getAvatarSource } from '../utils/iconUtils';

const colors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function PersonForm() {
  const { state, dispatch } = useApp();
  const { alertState, hideAlert, showErrorAlert } = useCustomAlert();
  
  const isEditing = state.selectedPersonId !== null;
  const existingPerson = isEditing 
    ? state.people.find(p => p.id === state.selectedPersonId)
    : null;

  const [formData, setFormData] = useState({
    name: existingPerson?.name || '',
    icon: (existingPerson?.icon || 'av0') as string,
    color: existingPerson?.color || colors[0]
  });

  useEffect(() => {
    if (existingPerson) {
      setFormData({
        name: existingPerson.name,
        icon: existingPerson.icon,
        color: existingPerson.color
      });
    }
  }, [existingPerson]);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      showErrorAlert('Please enter a name');
      return;
    }

    if (isEditing && existingPerson) {
      const updatedPerson: Person = {
        ...existingPerson,
        name: formData.name.trim(),
        icon: formData.icon,
        color: formData.color
      };
      dispatch({ type: 'UPDATE_PERSON', payload: updatedPerson });
    } else {
      const newPerson: Person = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        icon: formData.icon,
        color: formData.color,
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_PERSON', payload: newPerson });
    }

    dispatch({ type: 'SET_SELECTED_PERSON', payload: null });
    dispatch({ type: 'GO_BACK' });
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
            dispatch({ type: 'SET_SELECTED_PERSON', payload: null });
            dispatch({ type: 'GO_BACK' });
          }}
          style={styles.backButton}
        >
          <Icon name="back" size={ICON_SIZES.ACTION} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edit Person' : 'New Person'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter person's name"
            placeholderTextColor="#6b7280"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            autoFocus
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Avatar</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            style={styles.avatarScroll}
            contentContainerStyle={styles.avatarContainer}
            bounces={false}
            alwaysBounceHorizontal={false}
          >
            {avatarOptions.map(avatarName => (
              <TouchableOpacity
                key={avatarName}
                style={[
                  styles.avatarOption,
                  formData.icon === avatarName && styles.avatarOptionSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, icon: avatarName }))}
                activeOpacity={0.7}
              >
                <Image
                  source={getAvatarSource(avatarName)}
                  style={styles.avatarImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorContainer}>
            {colors.map(color => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  formData.color === color && styles.colorOptionSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, color }))}
                activeOpacity={0.7}
              >
                {formData.color === color && (
                  <Icon name="success" size={16} color="#ffffff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Update Person' : 'Add Person'}
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
    marginBottom: 12,
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
  avatarScroll: {
    marginHorizontal: -20,
  },
  avatarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    gap: 12,
    alignItems: 'center',
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#202020ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  avatarOptionSelected: {
    borderColor: '#ec9706',
    backgroundColor: '#ec970620',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#ffffff',
    transform: [{ scale: 1.1 }],
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
