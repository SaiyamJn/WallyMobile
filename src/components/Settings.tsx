import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, TextInput, Platform } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';
import { CustomInputModal } from './ui/CustomInputModal';

export function Settings() {
  const { state, dispatch, currencies, exportData, importData } = useApp();
  const { alertState, hideAlert, showDeleteAlert, showSuccessAlert, showErrorAlert } = useCustomAlert();
  const [showImportModal, setShowImportModal] = useState(false);

  const handleCurrencyChange = (currency: typeof currencies[0]) => {
    dispatch({ type: 'SET_CURRENCY', payload: currency });
    showSuccessAlert(`Currency changed to ${currency.name}`);
  };

  const handleClearData = () => {
    showDeleteAlert(
      'Clear All Data',
      'This will delete all transactions, categories, and accounts. This action cannot be undone. Make sure you have a backup before proceeding.',
      () => {
        dispatch({ type: 'CLEAR_ALL_DATA' });
      }
    );
  };

  const handleExportData = async () => {
    try {
      const backupJson = await exportData();
      const fileName = `Wally_Backup_${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS === 'web') {
        // For web, create a download link
        const blob = new Blob([backupJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showSuccessAlert('Backup exported successfully!');
      } else {
        // For mobile, use Share API
        const result = await Share.share({
          message: backupJson,
          title: fileName
        });
        
        if (result.action === Share.sharedAction) {
          showSuccessAlert('Backup shared successfully!');
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      showErrorAlert('Failed to export backup. Please try again.');
    }
  };

  const handleImportData = async (backupJson: string) => {
    if (!backupJson.trim()) {
      showErrorAlert('Please paste your backup data');
      return;
    }

    const result = await importData(backupJson);
    if (result.success) {
      setShowImportModal(false);
      showSuccessAlert(result.message);
    } else {
      showErrorAlert(result.message);
    }
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
          <Icon name="back" size={ICON_SIZES.BACK_BUTTON} color="#ffffff" />
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
            <Icon name="chart" size={ICON_SIZES.ACTION} />
            <View style={styles.dataInfo}>
              <Text style={styles.dataTitle}>Manage Categories</Text>
              <Text style={styles.dataDescription}>Add, edit, or delete categories</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dataButton}
            onPress={handleExportData}
          >
            <Icon name="save" size={ICON_SIZES.ACTION} />
            <View style={styles.dataInfo}>
              <Text style={styles.dataTitle}>Export Backup</Text>
              <Text style={styles.dataDescription}>Save your data to a backup file</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dataButton}
            onPress={() => setShowImportModal(true)}
          >
            <Icon name="edit" size={ICON_SIZES.ACTION} />
            <View style={styles.dataInfo}>
              <Text style={styles.dataTitle}>Import Backup</Text>
              <Text style={styles.dataDescription}>Restore data from a backup file</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dataButton}
            onPress={handleClearData}
          >
            <Icon name="delete" size={ICON_SIZES.ACTION} />
            <View style={styles.dataInfo}>
              <Text style={styles.dataTitle}>Clear All Data</Text>
              <Text style={styles.dataDescription}>Reset the app to initial state</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Backup Warning */}
      <View style={styles.section}>
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Important: Data Backup</Text>
          <Text style={styles.warningText}>
            Your data is automatically saved locally. However, if you uninstall the app, all data will be permanently deleted.
          </Text>
          <Text style={styles.warningText}>
            Before uninstalling, make sure to export a backup using the "Export Backup" option above. You can restore it later using "Import Backup".
          </Text>
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
            <Text style={styles.infoValue}>4.0.0</Text>
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
          <Text style={styles.appName}>Wally</Text>
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

      {/* Import Backup Modal */}
      <CustomInputModal
        visible={showImportModal}
        title="Import Backup"
        message="Paste your backup JSON data below. This will replace all current data."
        placeholder="Paste backup JSON here..."
        keyboardType="default"
        multiline={true}
        onConfirm={handleImportData}
        onCancel={() => {
          setShowImportModal(false);
        }}
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
    gap: 12,
  },
  dataIcon: {
    fontSize: 24,
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
  warningCard: {
    backgroundColor: '#f59e0b20',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 8,
  },
});