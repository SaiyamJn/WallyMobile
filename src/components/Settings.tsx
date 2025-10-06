import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';

export function Settings() {
  const { state, dispatch, currencies } = useApp();
  const { alertState, hideAlert, showDeleteAlert, showSuccessAlert } = useCustomAlert();

  const handleCurrencyChange = (currency: typeof currencies[0]) => {
    dispatch({ type: 'SET_CURRENCY', payload: currency });
    showSuccessAlert(`Currency changed to ${currency.name}`);
  };

  const handleClearData = () => {
    showDeleteAlert(
      'Clear All Data',
      'This will delete all transactions, categories, and accounts. This action cannot be undone.',
      () => {
        dispatch({ type: 'CLEAR_ALL_DATA' });
      }
    );
  };

  return (
    <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => dispatch({ type: 'GO_BACK' })}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <View style={styles.dataCard}>
          <TouchableOpacity
            style={styles.dataButton}
            onPress={() => dispatch({ type: 'SET_SCREEN', payload: 'categories' })}
          >
            <Text style={styles.dataIcon}>📁</Text>
            <View style={styles.dataInfo}>
              <Text style={styles.dataTitle}>Manage Categories</Text>
              <Text style={styles.dataDescription}>Add, edit, or delete categories</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dataButton}
            onPress={handleClearData}
          >
            <Text style={styles.dataIcon}>🗑️</Text>
            <View style={styles.dataInfo}>
              <Text style={styles.dataTitle}>Clear All Data</Text>
              <Text style={styles.dataDescription}>Reset the app to initial state</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Currency Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Currency</Text>
        <View style={styles.currencyCard}>
          <Text style={styles.currentCurrency}>
            {state.currentCurrency.symbol} {state.currentCurrency.name}
          </Text>
          <View style={styles.currencyGrid}>
            {currencies.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.currencyGridButton,
                  state.currentCurrency.code === currency.code && styles.currencyGridButtonActive
                ]}
                onPress={() => handleCurrencyChange(currency)}
              >
                <Text style={styles.currencyGridSymbol}>{currency.symbol}</Text>
                <Text style={[
                  styles.currencyGridCode,
                  state.currentCurrency.code === currency.code && styles.currencyGridCodeActive
                ]}>
                  {currency.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* App Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>2.1.1</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Total Transactions</Text>
            <Text style={styles.infoValue}>{state.transactions.length}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Categories</Text>
            <Text style={styles.infoValue}>{state.categories.length}</Text>
          </View>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.appName}>WallyMobile</Text>
          <Text style={styles.appDescription}>
            A simple and elegant personal finance manager to help you track your income and expenses.
          </Text>
          <Text style={styles.appFeatures}>
            • Track income and expenses{'\n'}
            • Categorize transactions{'\n'}
            • View detailed reports{'\n'}
            • Multiple currency support{'\n'}
            • Dark theme optimized
          </Text>
        </View>
      </View>
      
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    marginTop:30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 12,
    padding: 6,
    backgroundColor: '#202020ff',
    borderRadius: 8,
  },
  backIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  title: {
    fontSize: 24,
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
    paddingTop: 50,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  currencyCard: {
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
  },
  currentCurrency: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  currencyGridButton: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#3e3e3eff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  currencyGridButtonActive: {
    backgroundColor: '#10b981',
  },
  currencyGridSymbol: {
    fontSize: 20,
    marginBottom: 4,
  },
  currencyGridCode: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '600',
    textAlign: 'center',
  },
  currencyGridCodeActive: {
    color: '#ffffff',
  },
  infoCard: {
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3e3e3eff',
  },
  infoLabel: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  dataCard: {
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3e3e3eff',
  },
  dataIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  dataInfo: {
    flex: 1,
  },
  dataTitle: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  dataDescription: {
    fontSize: 16,
    color: '#9ca3af',
  },
  arrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
  aboutCard: {
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 16,
    color: '#9ca3af',
    lineHeight: 24,
    marginBottom: 16,
  },
  appFeatures: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
});