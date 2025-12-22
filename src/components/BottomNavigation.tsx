import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Screen } from '../types';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';

const navigationItems = [
  { screen: 'dashboard' as Screen, icon: 'dashboard', label: 'Dashboard' },
  { screen: 'transactions' as Screen, icon: 'transactions', label: 'Transactions' },
  { screen: 'accounts' as Screen, icon: 'accounts', label: 'Accounts' },
  { screen: 'reports' as Screen, icon: 'reports', label: 'Reports' },
  { screen: 'settings' as Screen, icon: 'settings', label: 'Settings' },
];

interface BottomNavigationProps {
  bottomNavRef?: React.RefObject<View>;
}

export function BottomNavigation({ bottomNavRef }: BottomNavigationProps = {}) {
  const { state, dispatch } = useApp();

  return (
    <View ref={bottomNavRef} style={styles.container}>
      <View style={styles.navigation}>
        {navigationItems.map(({ screen, icon }) => {
          const isActive = state.currentScreen === screen;
          return (
            <TouchableOpacity
              key={screen}
              style={[styles.navButton, isActive && styles.navButtonActive]}
              onPress={() => dispatch({ type: 'SET_SCREEN', payload: screen })}
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