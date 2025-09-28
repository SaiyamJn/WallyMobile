import React, { useRef, useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, PanResponder, Dimensions, Animated, Text, ActivityIndicator, Image } from 'react-native';
import { AppProvider, useApp } from './src/contexts/AppContext';
import { Dashboard } from './src/components/Dashboard';
import { TransactionsList } from './src/components/TransactionsList';
import { AddTransactionForm } from './src/components/AddTransactionForm';
import { CategoryManagement } from './src/components/CategoryManagement';
import { Reports } from './src/components/Reports';
import { Settings } from './src/components/Settings';
import { Accounts } from './src/components/Accounts';
import { BottomNavigation } from './src/components/BottomNavigation';

function AppContent() {
  const { state, dispatch } = useApp();
  const { width } = Dimensions.get('window');
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const swipeAnimation = useRef(new Animated.Value(0)).current;

  // Show loading screen for 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes with sufficient movement
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 30;
      },
      onPanResponderGrant: () => {
        // Reset animation when gesture starts
        swipeAnimation.setValue(0);
        setSwipeDirection(null);
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx } = gestureState;
        const maxSwipe = 100;
        const progress = Math.min(Math.abs(dx) / maxSwipe, 1);
        
        // Update animation based on swipe progress
        swipeAnimation.setValue(progress);
        
        // Set direction for visual feedback
        if (Math.abs(dx) > 30) {
          setSwipeDirection(dx > 0 ? 'right' : 'left');
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        const swipeThreshold = 50;
        
        // Don't allow swiping on certain screens
        const nonSwipeableScreens = ['add-transaction', 'categories'];
        if (nonSwipeableScreens.includes(state.currentScreen)) {
          // Reset animation
          Animated.timing(swipeAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
          setSwipeDirection(null);
          return;
        }
        
        if (Math.abs(dx) > swipeThreshold) {
          const screens = ['dashboard', 'transactions', 'accounts', 'reports', 'settings'];
          const currentIndex = screens.indexOf(state.currentScreen);
          
          if (dx > 0 && currentIndex > 0) {
            // Swipe right - go to previous screen
            dispatch({ type: 'SET_SCREEN', payload: screens[currentIndex - 1] as any });
          } else if (dx < 0 && currentIndex < screens.length - 1) {
            // Swipe left - go to next screen
            dispatch({ type: 'SET_SCREEN', payload: screens[currentIndex + 1] as any });
          }
        }
        
        // Reset animation
        Animated.timing(swipeAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
        setSwipeDirection(null);
      },
    })
  ).current;

  const renderCurrentScreen = () => {
    switch (state.currentScreen) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <TransactionsList />;
      case 'add-transaction':
        return <AddTransactionForm />;
      case 'categories':
        return <CategoryManagement />;
      case 'accounts':
        return <Accounts />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  // Loading screen component
  const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <Image 
          source={require('./assets/wallet.png')} 
          style={styles.appIcon}
          resizeMode="contain"
        />
        <Text style={styles.appTitle}>WallyMobile</Text>
        <Text style={styles.loadingText}>Loading your finances...</Text>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    </View>
  );

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#000000" />
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <View style={styles.container}>
          <View style={styles.content} {...panResponder.panHandlers}>
            {renderCurrentScreen()}
            <BottomNavigation />
            
            {/* Swipe indicator */}
            {swipeDirection && (
              <Animated.View 
                style={[
                  styles.swipeIndicator,
                  {
                    opacity: swipeAnimation,
                    transform: [{
                      translateX: swipeAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: swipeDirection === 'left' ? [50, 0] : [-50, 0],
                      })
                    }]
                  }
                ]}
              >
                <Text style={styles.swipeText}>
                  {swipeDirection === 'left' ? '← Next' : 'Previous →'}
                </Text>
              </Animated.View>
            )}
          </View>
        </View>
      )}
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    width: 100,
    height: 100,
    marginBottom: 24,
    borderRadius: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 32,
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    backgroundColor: '#000000',
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -15,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  swipeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});