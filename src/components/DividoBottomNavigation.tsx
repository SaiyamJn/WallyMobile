import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Screen } from '../types';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';

const navigationItems = [
  { screen: 'divido' as Screen, icon: 'dashboard' },
  { screen: 'people-list' as Screen, icon: 'people' },
  { screen: 'divido-settings' as Screen, icon: 'settings' },
];

export function DividoBottomNavigation() {
  const { state, dispatch } = useApp();

  // Determine if a screen is active (for Divido screens, consider divido as home)
  const isScreenActive = (screen: Screen): boolean => {
    if (screen === 'divido') {
      // Home is active for divido and expense-group-detail screens
      return ['divido', 'expense-group-detail', 'add-expense-group', 'edit-expense-group', 'add-expense', 'edit-expense'].includes(state.currentScreen);
    }
    if (screen === 'people-list') {
      // People is active for people-list, add-person, edit-person screens
      return ['people-list', 'add-person', 'edit-person'].includes(state.currentScreen);
    }
    if (screen === 'divido-settings') {
      return state.currentScreen === 'divido-settings';
    }
    return state.currentScreen === screen;
  };

  const handleNavigation = (screen: Screen) => {
    if (screen === 'divido') {
      // Clear any selections when going to home
      dispatch({ type: 'SET_SELECTED_EXPENSE_GROUP', payload: null });
      dispatch({ type: 'SET_SELECTED_EXPENSE', payload: null });
      dispatch({ type: 'SET_SELECTED_PERSON', payload: null });
    }
    dispatch({ type: 'SET_SCREEN', payload: screen });
  };

  return (
    <View style={styles.container}>
      <View style={styles.navigation}>
        {navigationItems.map(({ screen, icon }) => {
          const isActive = isScreenActive(screen);
          return (
            <TouchableOpacity
              key={screen}
              style={[styles.navButton, isActive && styles.navButtonActive]}
              onPress={() => handleNavigation(screen)}
            >
              <Icon 
                name={icon} 
                size={ICON_SIZES.NAVIGATION} 
                color={isActive ? "#ffffff" : "#9ca3af"} 
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#202020ff',
    paddingBottom: 5,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 5,
    maxWidth: 400,
    alignSelf: 'center',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginHorizontal: 2,
    minHeight: 50,
  },
  navButtonActive: {
    backgroundColor: '#3e3e3eff',
    transform: [{ scale: 1.05 }],
  },
});
