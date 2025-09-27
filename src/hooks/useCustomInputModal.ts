import { useState } from 'react';

interface InputModalState {
  visible: boolean;
  title: string;
  message: string;
  placeholder: string;
  keyboardType: 'default' | 'numeric' | 'email-address';
}

export function useCustomInputModal() {
  const [modalState, setModalState] = useState<InputModalState>({
    visible: false,
    title: '',
    message: '',
    placeholder: '',
    keyboardType: 'default'
  });

  const showInputModal = (
    title: string,
    message: string,
    placeholder: string = '',
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default'
  ) => {
    setModalState({
      visible: true,
      title,
      message,
      placeholder,
      keyboardType
    });
  };

  const hideInputModal = () => {
    setModalState(prev => ({ ...prev, visible: false }));
  };

  return {
    modalState,
    showInputModal,
    hideInputModal
  };
}
