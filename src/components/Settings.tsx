import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
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
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

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

  const handleDownloadBackup = async () => {
    try {
      // Generate backup data
      const backupJson = await exportData();
      
      // Validate that we have backup data
      if (!backupJson || backupJson.trim().length === 0) {
        showErrorAlert('Failed to export: No data to export. Please ensure you have transactions, categories, or accounts.');
        return;
      }

      // Validate JSON is valid
      try {
        JSON.parse(backupJson);
      } catch (parseError) {
        showErrorAlert('Failed to export: Generated backup data is invalid. Please try again.');
        console.error('Invalid backup JSON:', parseError);
        return;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `Wally_Backup_${dateStr}.json`;

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
        showSuccessAlert('Backup downloaded successfully!');
      } else {
        // For mobile, save file and use sharing to save to Downloads
        let fileUri: string | null = null;
        let directory: string | null = null;

        // Try cacheDirectory first (always available, app-specific, no permissions needed)
        // cacheDirectory should always be available in Expo apps
        directory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
        
        if (!directory) {
          // If file system is truly unavailable, fall back to sharing JSON directly
          console.warn('File system directories not available, falling back to direct share');
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            try {
              // Share as text/JSON directly
              await Share.share({
                message: backupJson,
                title: fileName,
              });
              showSuccessAlert('Backup shared! You can save it from the share menu.');
              return;
            } catch (shareError) {
              console.error('Share error:', shareError);
              showErrorAlert('File system not available and sharing failed. Please restart the app and try again.');
              return;
            }
          } else {
            showErrorAlert('File system not available. Please restart the app and try again.');
            return;
          }
        }

        // Ensure proper path construction
        const dir = directory.endsWith('/') || directory.endsWith('\\') 
          ? directory 
          : `${directory}/`;
        fileUri = `${dir}${fileName}`;
        
        try {
          // Ensure directory exists (cacheDirectory should always exist, but be safe)
          try {
            const dirInfo = await FileSystem.getInfoAsync(directory);
            if (!dirInfo.exists) {
              await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
            }
          } catch (dirError) {
            // Directory might already exist or be inaccessible, continue anyway
            console.log('Directory check:', dirError);
          }
          
          // Write the file to device storage
          await FileSystem.writeAsStringAsync(fileUri, backupJson, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          
          // Verify file was written
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (!fileInfo.exists) {
            // Fallback to direct share if file write failed
            console.warn('File write verification failed, falling back to direct share');
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              await Share.share({
                message: backupJson,
                title: fileName,
              });
              showSuccessAlert('Backup shared! You can save it from the share menu.');
              return;
            }
            showErrorAlert('Failed to create backup file. Please check storage permissions.');
            return;
          }
          
          // Use expo-sharing to save to Downloads (on Android, this allows saving to Downloads)
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            try {
              await Sharing.shareAsync(fileUri, {
                mimeType: 'application/json',
                dialogTitle: 'Save Backup to Downloads',
                UTI: 'public.json'
              });
              showSuccessAlert('Backup saved! Check your Downloads folder.');
            } catch (shareError) {
              console.error('Sharing error:', shareError);
              // If sharing fails, try direct share as fallback
              try {
                await Share.share({
                  message: backupJson,
                  title: fileName,
                });
                showSuccessAlert('Backup shared! You can save it from the share menu.');
              } catch (fallbackError) {
                showErrorAlert(`Failed to save backup: ${shareError instanceof Error ? shareError.message : 'Unknown error'}`);
              }
            }
          } else {
            // Fallback to React Native Share
            try {
              await Share.share({
                message: backupJson,
                title: fileName,
              });
              showSuccessAlert('Backup shared! You can save it from the share menu.');
            } catch (shareError) {
              showErrorAlert('Sharing not available on this device.');
            }
          }
        } catch (writeError) {
          console.error('File write error:', writeError);
          // Fallback to direct share if file system operations fail
          try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              await Share.share({
                message: backupJson,
                title: fileName,
              });
              showSuccessAlert('Backup shared! You can save it from the share menu.');
              return;
            }
          } catch (shareError) {
            console.error('Fallback share error:', shareError);
          }
          const errorMessage = writeError instanceof Error ? writeError.message : 'Unknown error';
          showErrorAlert(`Failed to write backup file: ${errorMessage}. Please try sharing instead.`);
        }
      }
    } catch (error) {
      console.error('Error downloading backup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showErrorAlert(`Failed to download backup: ${errorMessage}. Please try again.`);
    }
  };

  const handleShareBackup = async () => {
    // Original share functionality
    try {
      const backupJson = await exportData();
      
      if (!backupJson || backupJson.trim().length === 0) {
        showErrorAlert('Failed to export: No data to export.');
        return;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `Wally_Backup_${dateStr}.json`;
      
      if (Platform.OS === 'web') {
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
        // Share directly with JSON text
        const shareResult = await Share.share({
          message: backupJson,
          title: fileName
        });
        
        if (shareResult.action === Share.sharedAction) {
          showSuccessAlert('Backup shared successfully!');
        }
      }
    } catch (error) {
      console.error('Error sharing backup:', error);
      showErrorAlert(`Failed to share backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportData = async () => {
    // Show options dialog instead of directly exporting
    setShowExportOptions(true);
  };

  const handleImportData = async (backupJson: string) => {
    if (!backupJson.trim()) {
      showErrorAlert('Please paste your backup data');
      return;
    }

    // Basic validation before sending to importData
    try {
      const parsed = JSON.parse(backupJson);
      // Quick check for Wally backup structure
      if (!parsed.version || !parsed.timestamp || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.categories) || !Array.isArray(parsed.accounts)) {
        showErrorAlert('Invalid backup file: This does not appear to be a valid Wally backup file. Please ensure you are importing a file exported from Wally.');
        return;
      }
    } catch (error) {
      showErrorAlert('Invalid backup file: Not a valid JSON file. Please ensure you are importing a Wally backup file.');
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

  const handlePickFile = async () => {
    try {
      // Check if we're on web
      if (Platform.OS === 'web') {
        showErrorAlert('File picker is not available on web. Please use the "Paste JSON" option.');
        return;
      }

      // Pick a document file
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', '*.json'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name || '';
        
        // Check file extension
        if (!fileName.toLowerCase().endsWith('.json')) {
          showErrorAlert('Invalid file type: Please select a JSON backup file exported from Wally.');
          return;
        }
        
        // Read the file content
        const fileContent = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        // Validate it's JSON and has Wally backup structure
        try {
          const parsed = JSON.parse(fileContent);
          // Quick check for Wally backup structure
          if (!parsed.version || !parsed.timestamp || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.categories) || !Array.isArray(parsed.accounts)) {
            showErrorAlert('Invalid backup file: This does not appear to be a valid Wally backup file. Please ensure you are importing a file exported from Wally.');
            return;
          }
        } catch (parseError) {
          showErrorAlert('Invalid backup file: Not a valid JSON file. Please ensure you are importing a Wally backup file.');
          return;
        }

        // Import the data (full validation happens in importData)
        const importResult = await importData(fileContent);
        if (importResult.success) {
          showSuccessAlert(importResult.message);
        } else {
          showErrorAlert(importResult.message);
        }
      }
    } catch (error) {
      console.error('Error picking file:', error);
      showErrorAlert(`Failed to read backup file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImportButtonPress = () => {
    // Always show import options (file picker works on mobile, paste works everywhere)
    setShowImportOptions(true);
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
            onPress={handleImportButtonPress}
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
            <Text style={styles.infoValue}>4.1.2</Text>
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

      {/* Import Options Alert */}
      <CustomAlert
        visible={showImportOptions}
        title="Import Backup"
        message={Platform.OS === 'web' 
          ? "Paste your backup JSON data to restore." 
          : "Choose how you want to import your backup:"}
        buttons={Platform.OS === 'web' 
          ? [
              {
                text: 'Open Paste Dialog',
                onPress: () => {
                  setShowImportOptions(false);
                  setShowImportModal(true);
                },
                style: 'default'
              },
              {
                text: 'Cancel',
                onPress: () => {
                  setShowImportOptions(false);
                },
                style: 'cancel'
              }
            ]
          : [
              {
                text: 'Pick File from Device',
                onPress: async () => {
                  setShowImportOptions(false);
                  await handlePickFile();
                },
                style: 'default'
              },
              {
                text: 'Paste JSON',
                onPress: () => {
                  setShowImportOptions(false);
                  setShowImportModal(true);
                },
                style: 'default'
              },
              {
                text: 'Cancel',
                onPress: () => {
                  setShowImportOptions(false);
                },
                style: 'cancel'
              }
            ]}
        onClose={() => setShowImportOptions(false)}
        verticalButtons={true}
      />

      {/* Export Options Alert */}
      <CustomAlert
        visible={showExportOptions}
        title="Export Backup"
        message="Choose how you want to export your backup:"
        buttons={[
          {
            text: 'Download to Device',
            onPress: async () => {
              setShowExportOptions(false);
              await handleDownloadBackup();
            },
            style: 'default'
          },
          {
            text: 'Share Backup',
            onPress: async () => {
              setShowExportOptions(false);
              await handleShareBackup();
            },
            style: 'default'
          },
          {
            text: 'Cancel',
            onPress: () => {
              setShowExportOptions(false);
            },
            style: 'cancel'
          }
        ]}
        onClose={() => setShowExportOptions(false)}
        verticalButtons={true}
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