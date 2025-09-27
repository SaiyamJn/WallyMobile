import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Screen } from '../types';

const navigationItems = [
  { screen: 'dashboard' as Screen, icon: '🏠',},
  { screen: 'transactions' as Screen, icon: '📋', },
  { screen: 'accounts' as Screen, icon: '💳', },
  { screen: 'reports' as Screen, icon: '📊', },
  { screen: 'settings' as Screen, icon: '⚙️', },
];

export function BottomNavigation() {
  const { state, dispatch } = useApp();

  return (
    <View style={styles.container}>
      <View style={styles.navigation}>
        {navigationItems.map(({ screen, icon, label }) => {
          const isActive = state.currentScreen === screen;
          return (
            <TouchableOpacity
              key={screen}
              style={[styles.navButton, isActive && styles.navButtonActive]}
              onPress={() => dispatch({ type: 'SET_SCREEN', payload: screen })}
            >
              <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
                {icon}
              </Text>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {label}
              </Text>
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
    borderTopWidth: 0,
    borderTopColor: '#202020ff',
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal:3,
  },
  navButtonActive: {
    backgroundColor: '#3e3e3eff',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navIconActive: {
    // Icon color is handled by the emoji itself
  },
  navLabel: {
    fontSize: 1,
    color: '#9ca3af',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});