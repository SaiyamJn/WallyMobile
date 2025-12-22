import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';
import { Icon } from './ui/Icon';
import { PersonAvatar } from './ui/PersonAvatar';
import { ICON_SIZES } from '../constants/iconSizes';

export function PeopleList() {
  const { state, dispatch } = useApp();
  const { alertState, hideAlert, showConfirmAlert } = useCustomAlert();

  const handleAddPerson = () => {
    dispatch({ type: 'SET_SELECTED_PERSON', payload: null });
    dispatch({ type: 'SET_SCREEN', payload: 'add-person' });
  };

  const handleEditPerson = (personId: string) => {
    dispatch({ type: 'SET_SELECTED_PERSON', payload: personId });
    dispatch({ type: 'SET_SCREEN', payload: 'edit-person' });
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
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => dispatch({ type: 'GO_BACK' })}
          style={styles.backButton}
        >
          <Icon name="back" size={ICON_SIZES.ACTION} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>People</Text>
        <TouchableOpacity 
          onPress={handleAddPerson}
          style={styles.addButton}
        >
          <Icon name="add" size={ICON_SIZES.ACTION} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {state.people.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="people" size={ICON_SIZES.EMPTY_STATE} />
          <Text style={styles.emptyTitle}>No people yet</Text>
          <Text style={styles.emptyText}>
            Add people to start creating expense groups and splitting bills
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={handleAddPerson}
          >
            <Icon name="add" size={ICON_SIZES.SM} color="#ffffff" />
            <Text style={styles.emptyButtonText}>Add Your First Person</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.peopleList}>
          {state.people.map(person => (
            <View key={person.id} style={styles.personCard}>
              <View style={styles.personLeft}>
                <View style={[styles.personIcon, { backgroundColor: person.color + '20' }]}>
                  <PersonAvatar icon={person.icon} size={50} />
                </View>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personMeta}>
                    Added {new Date(person.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.personActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditPerson(person.id)}
                >
                  <Icon name="edit" size={ICON_SIZES.LG} color="#ec9706" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeletePerson(person.id)}
                >
                  <Icon name="delete" size={ICON_SIZES.LG} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={hideAlert}
        onConfirm={alertState.onConfirm}
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
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginLeft: 8,
  },
  addButton: {
    padding: 8,
    backgroundColor: '#202020ff',
    borderRadius: 8,
  },
  peopleList: {
    gap: 12,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
  },
  personLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  personIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  personMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  personActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ec9706',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
