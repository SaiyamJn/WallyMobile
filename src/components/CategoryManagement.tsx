import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Category } from '../types';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';
import { Icon } from './ui/Icon';
import { categoryIconOptions } from '../utils/iconUtils';
import { ICON_SIZES } from '../constants/iconSizes';

export function CategoryManagement() {
  const { state, dispatch } = useApp();
  const { alertState, hideAlert, showDeleteAlert, showErrorAlert } = useCustomAlert();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    icon: 'card',
    color: '#ed9149'
  });

  const expenseCategories = state.categories.filter(c => c.type === 'expense');
  const incomeCategories = state.categories.filter(c => c.type === 'income');

  const colorOptions = ['#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#84cc16'];


  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      showErrorAlert('Please enter a category name');
      return;
    }

    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name.trim(),
      type: newCategory.type,
      icon: newCategory.icon,
      color: newCategory.color
    };

    dispatch({ type: 'ADD_CATEGORY', payload: category });
    setNewCategory({ name: '', type: 'expense', icon: 'card', color: '#ed9149' });
    setShowAddForm(false);
  };

  const handleDeleteCategory = (id: string) => {
    const category = state.categories.find(c => c.id === id);
    const hasTransactions = state.transactions.some(t => t.category === category?.name);
    
    if (hasTransactions) {
      showErrorAlert('This category has transactions. Please delete or reassign the transactions first.');
      return;
    }

    showDeleteAlert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      () => {
        dispatch({ type: 'DELETE_CATEGORY', payload: id });
      }
    );
  };

  const handleResetCategories = () => {
    // Get default category names
    const defaultCategoryNames = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 
      'Healthcare', 'Salary', 'Freelance', 'Investment', 'Other Income'];
    
    // Check if there are any custom categories with transactions
    const customCategoriesWithTransactions = state.categories.filter(category => {
      const isCustomCategory = !defaultCategoryNames.includes(category.name);
      const hasTransactions = state.transactions.some(transaction => transaction.category === category.name);
      return isCustomCategory && hasTransactions;
    });

    if (customCategoriesWithTransactions.length > 0) {
      const categoryNames = customCategoriesWithTransactions.map(cat => cat.name).join(', ');
      showErrorAlert(
        `The following custom categories have transactions and will be preserved: ${categoryNames}. All default categories will be restored.`
      );
    }

    // Show confirmation dialog using custom alert
    showDeleteAlert(
      'Reset Categories',
      'This will restore all default categories. Custom categories with transactions will be preserved. Continue?',
      () => {
        dispatch({ type: 'RESET_CATEGORIES' });
        showErrorAlert('Categories have been reset to defaults');
      }
    );
  };

  const renderCategoryList = (categories: Category[], title: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.categoriesList}>
        {categories.map((category) => (
          <View key={category.id} style={styles.categoryItem}>
            <View style={styles.categoryLeft}>
              <View 
                style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' }]}
              >
                <Icon name={category.icon} size={ICON_SIZES.CATEGORY} />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteCategory(category.id)}
            >
              <Icon name="delete" size={ICON_SIZES.ACTION} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
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
          
          <View style={styles.titleContainer}>
            <Text style={styles.titleLine1}>Manage</Text>
            <Text style={styles.titleLine2}>Categories</Text>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetCategories}
            >
              <Text style={styles.resetButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

      {!showAddForm ? (
        <>
          {renderCategoryList(expenseCategories, 'Expense')}
          {renderCategoryList(incomeCategories, 'Income')}
        </>
      ) : (
        <View style={styles.addForm}>
          <Text style={styles.formTitle}>Add Category</Text>
          
          {/* Category Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category Name *</Text>
            <TextInput
              style={styles.input}
              value={newCategory.name}
              onChangeText={(text) => setNewCategory({...newCategory, name: text})}
              placeholder="Category name"
            />
          </View>

          {/* Category Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type *</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newCategory.type === 'expense' && styles.typeButtonActive
                ]}
                onPress={() => setNewCategory({...newCategory, type: 'expense'})}
              >
                <Text style={[
                  styles.typeButtonText,
                  newCategory.type === 'expense' && styles.typeButtonTextActive
                ]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newCategory.type === 'income' && styles.typeButtonActive
                ]}
                onPress={() => setNewCategory({...newCategory, type: 'income'})}
              >
                <Text style={[
                  styles.typeButtonText,
                  newCategory.type === 'income' && styles.typeButtonTextActive
                ]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Icon Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Icon</Text>
            <Text style={styles.scrollHint}>← Swipe or scroll to see more icons →</Text>
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
                {categoryIconOptions.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconButton,
                      newCategory.icon === icon && styles.iconButtonActive
                    ]}
                    onPress={() => setNewCategory({...newCategory, icon})}
                  >
                    <Icon name={icon} size={ICON_SIZES.ICON_SELECTION} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Color Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <View style={styles.colorSelector}>
              {colorOptions.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    newCategory.color === color && styles.colorButtonActive
                  ]}
                  onPress={() => setNewCategory({...newCategory, color})}
                />
              ))}
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
              onPress={handleAddCategory}
            >
              <Text style={styles.saveButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 6,
    backgroundColor: '#202020ff',
    borderRadius: 8,
  },
  backIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  titleLine1: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 22,
  },
  titleLine2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 22,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  categoriesList: {
    backgroundColor: '#202020ff',
    borderRadius: 16,
    padding: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 12,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: 'bold',
  },
  resetButton: {
    padding: 8,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 18,
    color: '#ffffff',
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
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#3e3e3eff',
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
    backgroundColor: '#10b981',
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
  scrollHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
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
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: '#ffffff',
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