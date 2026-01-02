import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../../contexts/AppContext';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { CustomAlert } from './CustomAlert';
import { Icon } from './Icon';
import { ICON_SIZES } from '../../constants/iconSizes';

interface ManageGroupsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ManageGroupsModal({ visible, onClose }: ManageGroupsModalProps) {
  const { state, dispatch, formatCurrency } = useApp();
  const { alertState, hideAlert, showConfirmAlert } = useCustomAlert();

  const handleAddGroup = () => {
    dispatch({ type: 'SET_SCREEN', payload: 'add-expense-group' });
    onClose();
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = state.expenseGroups.find(g => g.id === groupId);
    showConfirmAlert(
      'Delete Group',
      `Are you sure you want to delete "${group?.name}"? This will also delete all expenses in this group.`,
      () => {
        dispatch({ type: 'DELETE_EXPENSE_GROUP', payload: groupId });
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
              <Text style={styles.title}>Manage Groups</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="cancel" size={ICON_SIZES.ACTION} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {state.expenseGroups.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="chart" size={ICON_SIZES.EMPTY_STATE} />
                  <Text style={styles.emptyText}>No groups yet</Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {state.expenseGroups.map(group => {
                    const groupExpenses = state.expenses.filter(e => e.groupId === group.id);
                    const totalExpenses = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
                    return (
                      <View key={group.id} style={styles.listItem}>
                        <View style={styles.listItemLeft}>
                          <View style={styles.groupIcon}>
                            <Icon name="groups" size={ICON_SIZES.SM} />
                          </View>
                          <View style={styles.groupInfo}>
                            <Text style={styles.groupName}>{group.name}</Text>
                            <Text style={styles.groupMeta}>
                              {group.members.length} member{group.members.length !== 1 ? 's' : ''} • {formatCurrency(totalExpenses)}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteGroup(group.id)}
                        >
                          <Icon name="delete" size={ICON_SIZES.SM} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddGroup}
            >
              <Icon name="add" size={ICON_SIZES.SM} color="#ffffff" />
              <Text style={styles.addButtonText}>Add Group</Text>
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
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 12,
    color: '#9ca3af',
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
