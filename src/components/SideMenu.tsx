import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  wallyMenuItemRef?: React.RefObject<View>;
  dividoMenuItemRef?: React.RefObject<View>;
}

export function SideMenu({ visible, onClose, wallyMenuItemRef, dividoMenuItemRef }: SideMenuProps) {
  const { state, dispatch } = useApp();
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleMenuItemPress = (screen: string) => {
    if (screen === 'dashboard') {
      // Clear any Divido-related selections when going back to Wally
      dispatch({ type: 'SET_SELECTED_EXPENSE_GROUP', payload: null });
      dispatch({ type: 'SET_SELECTED_EXPENSE', payload: null });
      dispatch({ type: 'SET_SELECTED_PERSON', payload: null });
    }
    dispatch({ type: 'SET_SCREEN', payload: screen as any });
    onClose();
  };

  const isWallyActive = !['divido', 'expense-group-detail', 'add-expense-group', 'edit-expense-group', 'people-list', 'add-person', 'edit-person', 'add-expense', 'edit-expense'].includes(state.currentScreen);
  const isDividoActive = ['divido', 'expense-group-detail', 'add-expense-group', 'edit-expense-group', 'people-list', 'add-person', 'edit-person', 'add-expense', 'edit-expense'].includes(state.currentScreen);

  const menuItems = [
    { 
      screen: 'dashboard', 
      label: 'Wally', 
      icon: 'wallet',
      description: 'Personal finance manager',
      isActive: isWallyActive
    },
    { 
      screen: 'divido', 
      label: 'Divido', 
      icon: 'divido',
      description: 'Split expenses with friends',
      isActive: isDividoActive
    },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.menu,
            {
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Menu</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Icon name="cancel" size={ICON_SIZES.ACTION} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.menuContent}>
            {menuItems.map((item) => {
              const activeColor = item.screen === 'dashboard' ? '#10b981' : '#ec9706';
              const itemRef = item.screen === 'dashboard' ? wallyMenuItemRef : dividoMenuItemRef;
              return (
                <TouchableOpacity
                  key={item.screen}
                  ref={itemRef}
                  style={[
                    styles.menuItem,
                    item.isActive && [
                      styles.menuItemActive,
                      {
                        backgroundColor: activeColor + '15',
                        borderLeftColor: activeColor,
                      }
                    ]
                  ]}
                  onPress={() => handleMenuItemPress(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuItemIconContainer}>
                      <Icon 
                        name={item.icon as any} 
                        size={44} 
                      />
                    </View>
                    <View style={styles.menuItemText}>
                      <Text style={[
                        styles.menuItemLabel,
                        item.isActive && [
                          styles.menuItemLabelActive,
                          { color: activeColor }
                        ]
                      ]}>
                        {item.label}
                      </Text>
                      {item.description && (
                        <Text style={styles.menuItemDescription}>{item.description}</Text>
                      )}
                    </View>
                  </View>
                  {item.isActive && (
                    <View style={[styles.activeIndicator, { backgroundColor: activeColor }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  menu: {
    width: 320,
    backgroundColor: '#111111',
    borderRightWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 28,
    paddingTop: 64,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
  },
  menuTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1f1f1f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  menuContent: {
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginVertical: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  menuItemActive: {
    borderLeftWidth: 4,
    marginLeft: 4,
    borderColor: 'transparent',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  menuItemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  menuItemText: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#8b8b8b',
    lineHeight: 18,
    fontWeight: '400',
  },
  menuItemLabelActive: {
    fontWeight: '700',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
