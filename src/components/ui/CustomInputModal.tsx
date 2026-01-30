import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';

interface CustomInputModalProps {
  visible: boolean;
  title: string;
  message: string;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'decimal-pad';
  multiline?: boolean;
  /** When set, show a "Paste from clipboard" button (e.g. for backup JSON import) */
  showPasteButton?: boolean;
  /** Optional initial value when modal opens (e.g. for partial settlement amount) */
  initialValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function CustomInputModal({ 
  visible, 
  title, 
  message, 
  placeholder = '', 
  keyboardType = 'default',
  multiline = false,
  showPasteButton = false,
  initialValue = '',
  onConfirm, 
  onCancel 
}: CustomInputModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [pasting, setPasting] = useState(false);

  // Set input when modal is opened (initialValue for amount modals, else empty)
  useEffect(() => {
    if (visible) {
      setInputValue(initialValue);
    }
  }, [visible, initialValue]);

  const handleConfirm = () => {
    onConfirm(inputValue.trim());
    setInputValue('');
  };

  const handleCancel = () => {
    setInputValue('');
    onCancel();
  };

  const handlePaste = async () => {
    try {
      setPasting(true);
      const text = await Clipboard.getStringAsync();
      if (text && text.trim()) {
        setInputValue(text.trim());
      }
    } catch (e) {
      // Ignore clipboard errors (e.g. permission or empty)
    } finally {
      setPasting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.modalContainer}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <View style={styles.modalContent}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              
              <TextInput
                style={[styles.input, multiline && styles.inputMultiline]}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={multiline ? 15 : 1}
                textAlignVertical={multiline ? 'top' : 'center'}
                autoFocus={!multiline}
                selectTextOnFocus={!multiline}
                scrollEnabled={multiline}
                textBreakStrategy="simple"
                editable={!pasting}
              />
              {showPasteButton && (
                <TouchableOpacity
                  style={styles.pasteButton}
                  onPress={handlePaste}
                  disabled={pasting}
                >
                  {pasting ? (
                    <ActivityIndicator size="small" color="#ec9706" />
                  ) : (
                    <Text style={styles.pasteButtonText}>Paste from clipboard</Text>
                  )}
                </TouchableOpacity>
              )}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: '#202020ff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#3e3e3eff',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  inputMultiline: {
    minHeight: 250,
    maxHeight: 500,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
  pasteButton: {
    backgroundColor: '#3e3e3eff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  pasteButtonText: {
    color: '#ec9706',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
