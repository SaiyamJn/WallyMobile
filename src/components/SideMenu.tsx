import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function SideMenu({ visible, onClose }: SideMenuProps) {
  const { state, dispatch } = useApp();
  const slideAnim = React.useRef(new Animated.Value(-300)).current;

  React.useEffect(() => {
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
      icon: 'card',
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
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.screen}
                style={[
                  styles.menuItem,
                  item.isActive && styles.menuItemActive
                ]}
                onPress={() => handleMenuItemPress(item.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[
                    styles.menuItemIcon,
                    item.isActive && styles.menuItemIconActive
                  ]}>
                    <Icon name={item.icon as any} size={ICON_SIZES.SM} />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={[
                      styles.menuItemLabel,
                      item.isActive && styles.menuItemLabelActive
                    ]}>
                      {item.label}
                    </Text>
                    {item.description && (
                      <Text style={styles.menuItemDescription}>{item.description}</Text>
                    )}
                  </View>
                </View>
                {item.isActive && (
                  <View style={styles.activeIndicator} />
                )}
              </TouchableOpacity>
            ))}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menu: {
    width: 280,
    backgroundColor: '#1a1a1a',
    borderRightWidth: 1,
    borderRightColor: '#333333',
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
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  menuContent: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: 'transparent',
  },
  menuItemActive: {
    backgroundColor: '#3b82f620',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#202020ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemIconActive: {
    backgroundColor: '#3b82f620',
  },
  menuItemText: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#9ca3af',
  },
  menuItemLabelActive: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
});
