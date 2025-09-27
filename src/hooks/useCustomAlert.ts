import { useState } from 'react';

interface AlertButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
}

export function useCustomAlert() {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });

  const showAlert = (title: string, message: string, buttons: AlertButton[]) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  // Convenience methods for common alert types
  const showConfirmAlert = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void
  ) => {
    showAlert(title, message, [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel || (() => {})
      },
      {
        text: 'Confirm',
        style: 'destructive',
        onPress: onConfirm
      }
    ]);
  };

  const showDeleteAlert = (
    title: string,
    message: string,
    onDelete: () => void,
    onCancel?: () => void
  ) => {
    showAlert(title, message, [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel || (() => {})
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: onDelete
      }
    ]);
  };

  const showErrorAlert = (message: string) => {
    showAlert('Error', message, [
      {
        text: 'OK',
        onPress: () => {}
      }
    ]);
  };

  const showSuccessAlert = (message: string) => {
    showAlert('Success', message, [
      {
        text: 'OK',
        onPress: () => {}
      }
    ]);
  };

  return {
    alertState,
    showAlert,
    hideAlert,
    showConfirmAlert,
    showDeleteAlert,
    showErrorAlert,
    showSuccessAlert
  };
}
