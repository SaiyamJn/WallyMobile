import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useApp, normalizeBackupJson } from '../contexts/AppContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';
import { Icon } from './ui/Icon';
import { ManagePeopleModal } from './ui/ManagePeopleModal';
import { ManageGroupsModal } from './ui/ManageGroupsModal';
import { CustomInputModal } from './ui/CustomInputModal';
import { ICON_SIZES } from '../constants/iconSizes';

export function DividoSettings() {
  const { state, dispatch, exportDividoData, importDividoData } = useApp();
  const { alertState, hideAlert, showDeleteAlert, showSuccessAlert, showErrorAlert } = useCustomAlert();
  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const handleClearData = () => {
    showDeleteAlert(
      'Clear Divido Data',
      'This will delete all people, expense groups, expenses, and settlements in Divido. Your Wally data will remain intact. This action cannot be undone. Make sure you have a backup before proceeding.',
      () => {
        dispatch({ type: 'CLEAR_DIVIDO_DATA' });
        showSuccessAlert('Divido data cleared successfully');
      }
    );
  };

  const handleDownloadBackup = async () => {
    try {
      const backupJson = await exportDividoData();
      
      if (!backupJson || backupJson.trim().length === 0) {
        showErrorAlert('Failed to export: Could not generate backup. Please try again.');
        return;
      }

      try {
        JSON.parse(backupJson);
      } catch (parseError) {
        showErrorAlert('Failed to export: Generated backup data is invalid. Please try again.');
        return;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `Divido_Backup_${dateStr}.json`;

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
        showSuccessAlert('Backup downloaded successfully!');
      } else {
        let fileUri: string | null = null;
        let directory: string | null = null;

        directory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
        
        if (!directory) {
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            try {
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

        const dir = directory.endsWith('/') || directory.endsWith('\\') 
          ? directory 
          : `${directory}/`;
        fileUri = `${dir}${fileName}`;
        
        try {
          try {
            const dirInfo = await FileSystem.getInfoAsync(directory);
            if (!dirInfo.exists) {
              await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
            }
          } catch (dirError) {
          }
          
          await FileSystem.writeAsStringAsync(fileUri, backupJson, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (!fileInfo.exists) {
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
          
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            try {
              await Sharing.shareAsync(fileUri, {
                mimeType: 'application/json',
                dialogTitle: 'Save Backup to Downloads',
                UTI: 'public.json'
              });
              showSuccessAlert('Backup ready! Save or share it from the menu.');
            } catch (shareError) {
              console.error('Sharing error:', shareError);
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
    try {
      const backupJson = await exportDividoData();
      
      if (!backupJson || backupJson.trim().length === 0) {
        showErrorAlert('Failed to export: No data to export.');
        return;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `Divido_Backup_${dateStr}.json`;
      
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
        const shareResult = await Share.share({
          message: backupJson,
          title: fileName
        });
        
        if (shareResult?.action === Share.sharedAction) {
          showSuccessAlert('Backup shared successfully!');
        }
        // If user dismissed without sharing, we don't show a message
      }
    } catch (error) {
      console.error('Error sharing backup:', error);
      showErrorAlert(`Failed to share backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportData = async () => {
    setShowExportOptions(true);
  };

  const handleImportData = async (backupJson: string) => {
    const normalized = normalizeBackupJson(backupJson);
    if (!normalized) {
      showErrorAlert('Please paste your backup data');
      return;
    }

    try {
      let parsed: unknown = JSON.parse(normalized);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      const data = parsed as Record<string, unknown>;
      if (!data.version || !data.timestamp || !Array.isArray(data.people) || !Array.isArray(data.expenseGroups) || !Array.isArray(data.expenses) || !Array.isArray(data.settlements)) {
        showErrorAlert('Invalid backup file: This does not appear to be a valid Divido backup file. Please ensure you are importing a file exported from Divido.');
        return;
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Invalid JSON';
      showErrorAlert(`Invalid JSON: ${errMsg}. Make sure you pasted the full backup. Try "Paste from clipboard" if you copied from another app.`);
      return;
    }

    const result = await importDividoData(normalized);
    if (result.success) {
      setShowImportModal(false);
      showSuccessAlert(result.message);
    } else {
      showErrorAlert(result.message);
    }
  };

  const handlePickFile = async () => {
    try {
      if (Platform.OS === 'web') {
        showErrorAlert('File picker is not available on web. Please use the "Paste JSON" option.');
        return;
      }

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
        
        if (!fileName.toLowerCase().endsWith('.json')) {
          showErrorAlert('Invalid file type: Please select a JSON backup file exported from Divido.');
          return;
        }
        
        const rawContent = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const fileContent = normalizeBackupJson(rawContent);

        try {
          let parsed: unknown = JSON.parse(fileContent);
          if (typeof parsed === 'string') parsed = JSON.parse(parsed);
          const data = parsed as Record<string, unknown>;
          if (!data.version || !data.timestamp || !Array.isArray(data.people) || !Array.isArray(data.expenseGroups) || !Array.isArray(data.expenses) || !Array.isArray(data.settlements)) {
            showErrorAlert('Invalid backup file: This does not appear to be a valid Divido backup file. Please ensure you are importing a file exported from Divido.');
            return;
          }
        } catch (parseError) {
          const errMsg = parseError instanceof Error ? parseError.message : 'Invalid JSON';
          showErrorAlert(`Invalid backup file: ${errMsg}. Please ensure you selected a valid Divido backup file.`);
          return;
        }

        const importResult = await importDividoData(fileContent);
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
            onPress={() => setShowPeopleModal(true)}
          >
            <Icon name="people" size={ICON_SIZES.ACTION + 4} />
            <View style={styles.dataInfo}>
              <Text style={styles.dataTitle}>Manage People</Text>
              <Text style={styles.dataDescription}>Add or delete people</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dataButton}
            onPress={() => setShowGroupsModal(true)}
          >
            <Icon name="groups" size={ICON_SIZES.ACTION + 4} />
            <View style={styles.dataInfo}>
              <Text style={styles.dataTitle}>Manage Groups</Text>
              <Text style={styles.dataDescription}>Add or delete expense groups</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dataButton}
            onPress={handleExportData}
          >
            <Icon name="save" size={ICON_SIZES.ACTION + 4} />
            <View style={styles.dataInfo}>
              <Text style={styles.dataTitle}>Export Backup</Text>
              <Text style={styles.dataDescription}>Save your Divido data to a backup file</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dataButton}
            onPress={handleImportButtonPress}
          >
            <Icon name="edit" size={ICON_SIZES.ACTION + 4} />
            <View style={styles.dataInfo}>
              <Text style={styles.dataTitle}>Import Backup</Text>
              <Text style={styles.dataDescription}>Restore Divido data from a backup file</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dataButton}
            onPress={handleClearData}
          >
            <Icon name="delete" size={ICON_SIZES.ACTION + 4} />
            <View style={styles.dataInfo}>
              <Text style={styles.dataTitle}>Clear Divido Data</Text>
              <Text style={styles.dataDescription}>Reset Divido to initial state</Text>
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

      {/* Warning */}
      <View style={styles.section}>
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Important: Data Reset</Text>
          <Text style={styles.warningText}>
            Clearing Divido data will permanently delete all people, expense groups, expenses, and settlements.
          </Text>
          <Text style={styles.warningText}>
            Your Wally data (transactions, categories, accounts) will remain untouched.
          </Text>
        </View>
      </View>

      {/* App Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>5.2.1</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Total People</Text>
            <Text style={styles.infoValue}>{state.people.length}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Expense Groups</Text>
            <Text style={styles.infoValue}>{state.expenseGroups.length}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Total Expenses</Text>
            <Text style={styles.infoValue}>{state.expenses.length}</Text>
          </View>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.appName}>Divido</Text>
          <Text style={styles.appDescription}>
            Split expenses with friends and track who owes what. Perfect for trips, shared bills, and group expenses.
          </Text>
          <Text style={styles.appFeatures}>
            • Create expense groups{'\n'}
            • Add people with custom avatars{'\n'}
            • Split expenses equally or custom{'\n'}
            • Track settlements{'\n'}
            • View detailed balance reports
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

      <ManagePeopleModal
        visible={showPeopleModal}
        onClose={() => setShowPeopleModal(false)}
      />

      <ManageGroupsModal
        visible={showGroupsModal}
        onClose={() => setShowGroupsModal(false)}
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
        message="Paste your backup JSON below or tap 'Paste from clipboard'. This will replace all current Divido data."
        placeholder="Paste backup JSON here..."
        keyboardType="default"
        multiline={true}
        showPasteButton={true}
        onConfirm={handleImportData}
        onCancel={() => {
          setShowImportModal(false);
        }}
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
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 6,
    backgroundColor: '#202020ff',
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
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
  dataInfo: {
    flex: 1,
  },
  dataTitle: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  dataDescription: {
    fontSize: 13,
    color: '#9ca3af',
  },
  arrow: {
    fontSize: 24,
    color: '#9ca3af',
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
