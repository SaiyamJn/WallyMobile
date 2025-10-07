import React, { useRef, useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, PanResponder, Animated, Text, ActivityIndicator, Image, BackHandler, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { AppProvider, useApp } from './src/contexts/AppContext';
import { Dashboard } from './src/components/Dashboard';
import { TransactionsList } from './src/components/TransactionsList';
import { AddTransactionForm } from './src/components/AddTransactionForm';
import { EditTransactionForm } from './src/components/EditTransactionForm';
import { CategoryManagement } from './src/components/CategoryManagement';
import { Reports } from './src/components/Reports';
import { Settings } from './src/components/Settings';
import { Accounts } from './src/components/Accounts';
import { BottomNavigation } from './src/components/BottomNavigation';
import { CategoryTransactions } from './src/components/CategoryTransactions';

const { width: screenWidth } = Dimensions.get('window');

function AppContent() {
  const { state, dispatch } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const swipeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const opacityAnimation = useRef(new Animated.Value(1)).current;
  const currentScreenRef = useRef(state.currentScreen);
  const previousScreenRef = useRef<string | null>(null);

  // Show loading screen for 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Update current screen ref when state changes
  useEffect(() => {
    const previousScreen = currentScreenRef.current;
    currentScreenRef.current = state.currentScreen;
    
    // Animate screen transition
    if (previousScreen && previousScreen !== state.currentScreen) {
      animateScreenTransition(previousScreen, state.currentScreen);
    }
  }, [state.currentScreen]);

  // Function to animate screen transitions
  const animateScreenTransition = (fromScreen: string, toScreen: string) => {
    const screens = ['dashboard', 'transactions', 'accounts', 'reports', 'settings'];
    const fromIndex = screens.indexOf(fromScreen);
    const toIndex = screens.indexOf(toScreen);
    
    if (fromIndex === -1 || toIndex === -1) return;
    
    const direction = toIndex > fromIndex ? 1 : -1;
    const slideDistance = screenWidth * direction;
    
    // Set initial position
    slideAnimation.setValue(slideDistance);
    opacityAnimation.setValue(0.7);
    
    // Animate to center with opacity
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      // Don't handle back button during loading
      if (isLoading) {
        return false;
      }

      // If we're on a main screen, exit the app
      const mainScreens = ['dashboard', 'transactions', 'accounts', 'reports', 'settings'];
      if (mainScreens.includes(state.currentScreen)) {
        return false; // Let the system handle app exit
      }

      // Otherwise, go back in navigation history
      dispatch({ type: 'GO_BACK' });
      return true; // Prevent default back behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [state.currentScreen, isLoading, dispatch]);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, gestureState) => {
        // Start capturing immediately for horizontal gestures
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        return isHorizontalSwipe && Math.abs(gestureState.dx) > 10;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Always capture horizontal swipes
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const hasEnoughMovement = Math.abs(gestureState.dx) > 20;
        const isFastSwipe = Math.abs(gestureState.vx) > 0.3;
        
        const shouldCapture = isHorizontalSwipe && (hasEnoughMovement || isFastSwipe);
        
        // Pan responder activated for horizontal swipe
        
        return shouldCapture;
      },
      onPanResponderTerminationRequest: () => {
        // Don't terminate if we've started a swipe
        return false;
      },
      onPanResponderGrant: () => {
        // Reset animation when gesture starts
        swipeAnimation.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx } = gestureState;
        const maxSwipe = 100;
        const progress = Math.min(Math.abs(dx) / maxSwipe, 1);
        
        // Update swipe animation for visual feedback
        swipeAnimation.setValue(progress);
        
        // Update slide animation for real-time preview
        const slideDistance = dx * 0.3; // Reduce movement for preview effect
        slideAnimation.setValue(slideDistance);
        
        // Update opacity for subtle feedback
        const opacityValue = Math.max(0.8, 1 - (Math.abs(dx) / 200));
        opacityAnimation.setValue(opacityValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        const swipeThreshold = 30; // Further reduced threshold for easier swiping
        const velocityThreshold = 0.1; // Further reduced velocity threshold
        
        // Don't allow swiping on certain screens
        const nonSwipeableScreens = ['add-transaction', 'categories'];
        if (nonSwipeableScreens.includes(currentScreenRef.current)) {
          // Reset animation
          Animated.timing(swipeAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
          return;
        }
        
        // Check if it's a valid swipe (either distance or velocity)
        const isValidSwipe = Math.abs(dx) > swipeThreshold || Math.abs(vx) > velocityThreshold;
        
        if (isValidSwipe) {
          const screens = ['dashboard', 'transactions', 'accounts', 'reports', 'settings'];
          const currentScreen = currentScreenRef.current;
          const currentIndex = screens.indexOf(currentScreen);
          
          // Swipe detected, processing navigation
          
          if (dx > 0 && currentIndex > 0) {
            // Swipe right - go to previous screen
            dispatch({ type: 'SET_SCREEN', payload: screens[currentIndex - 1] as any });
          } else if (dx < 0 && currentIndex < screens.length - 1) {
            // Swipe left - go to next screen
            dispatch({ type: 'SET_SCREEN', payload: screens[currentIndex + 1] as any });
          } else {
            // Invalid swipe - reset to center
            Animated.parallel([
              Animated.timing(slideAnimation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnimation, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              })
            ]).start();
          }
        } else {
          // No valid swipe - reset to center
          Animated.parallel([
            Animated.timing(slideAnimation, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnimation, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start();
        }
        
        // Reset swipe animation
        Animated.timing(swipeAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
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
      case 'edit-transaction':
        return <EditTransactionForm />;
      case 'categories':
        return <CategoryManagement />;
      case 'accounts':
        return <Accounts />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'category-transactions':
        return <CategoryTransactions 
          categoryName={state.selectedCategory || ''}
          onBack={() => dispatch({ type: 'GO_BACK' })}
        />;
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
          <KeyboardAvoidingView 
            style={styles.content}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            {...panResponder.panHandlers}
          >
            <Animated.View 
              style={[
                styles.screenContainer,
                {
                  transform: [{ translateX: slideAnimation }],
                  opacity: opacityAnimation,
                }
              ]}
            >
              {renderCurrentScreen()}
            </Animated.View>
          </KeyboardAvoidingView>
          <BottomNavigation />
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
  screenContainer: {
    flex: 1,
    width: '100%',
  },
});