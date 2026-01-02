import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { CustomAlert } from './CustomAlert';
import { Icon } from './Icon';
import { PersonAvatar } from './PersonAvatar';
import { ICON_SIZES } from '../../constants/iconSizes';

interface ManagePeopleModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ManagePeopleModal({ visible, onClose }: ManagePeopleModalProps) {
  const { state, dispatch } = useApp();
  const { alertState, hideAlert, showConfirmAlert } = useCustomAlert();

  const handleAddPerson = () => {
    dispatch({ type: 'SET_SELECTED_PERSON', payload: null });
    dispatch({ type: 'SET_SCREEN', payload: 'add-person' });
    onClose();
  };

  const handleDeletePerson = (personId: string) => {
    const person = state.people.find(p => p.id === personId);
    showConfirmAlert(
      'Delete Person',
      `Are you sure you want to delete "${person?.name}"? This will also remove them from all expense groups.`,
      () => {
        dispatch({ type: 'DELETE_PERSON', payload: personId });
      }
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Manage People</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="cancel" size={ICON_SIZES.ACTION} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {state.people.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="people" size={ICON_SIZES.EMPTY_STATE} />
                  <Text style={styles.emptyText}>No people yet</Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {state.people.map(person => (
                    <View key={person.id} style={styles.listItem}>
                      <View style={styles.listItemLeft}>
                        <View style={[styles.personIcon, { backgroundColor: person.color + '20' }]}>
                          <PersonAvatar icon={person.icon} size={40} />
                        </View>
                        <Text style={styles.personName}>{person.name}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeletePerson(person.id)}
                      >
                        <Icon name="delete" size={ICON_SIZES.SM} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddPerson}
            >
              <Icon name="add" size={ICON_SIZES.SM} color="#ffffff" />
              <Text style={styles.addButtonText}>Add Person</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 400,
  },
  list: {
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#202020ff',
    borderRadius: 12,
    marginBottom: 8,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  personIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ec9706',
    padding: 16,
    gap: 8,
    margin: 16,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
});
