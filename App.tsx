import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Text, ActivityIndicator, Image, BackHandler, KeyboardAvoidingView, Platform, ErrorUtils, TouchableOpacity, ScrollView } from 'react-native';
// Import all components normally - they should all work fine
import { AppProvider, useApp } from './src/contexts/AppContext';
import { ErrorBoundary } from './src/components/ui/ErrorBoundary';
import { Dashboard } from './src/components/Dashboard';
import { TransactionsList } from './src/components/TransactionsList';
import { AddTransactionForm } from './src/components/AddTransactionForm';
import { EditTransactionForm } from './src/components/EditTransactionForm';
import { CategoryManagement } from './src/components/CategoryManagement';
import { Reports } from './src/components/Reports';
import { Settings } from './src/components/Settings';
import { Accounts } from './src/components/Accounts';
import { BottomNavigation } from './src/components/BottomNavigation';
import { DividoBottomNavigation } from './src/components/DividoBottomNavigation';
import { DividoSettings } from './src/components/DividoSettings';
import { CategoryTransactions } from './src/components/CategoryTransactions';
import { Divido } from './src/components/Divido';
import { ExpenseGroupDetail } from './src/components/ExpenseGroupDetail';
import { ExpenseGroupForm } from './src/components/ExpenseGroupForm';
import { PeopleList } from './src/components/PeopleList';
import { PersonForm } from './src/components/PersonForm';
import { ExpenseForm } from './src/components/ExpenseForm';
import { WalkthroughOverlay } from './src/components/WalkthroughOverlay';
import AsyncStorage from '@react-native-async-storage/async-storage';

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [assetsReady, setAssetsReady] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [checkingWalkthrough, setCheckingWalkthrough] = useState(true);
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  
  // Refs for walkthrough targets
  const floatingAddRef = React.useRef<View>(null);
  const menuButtonRef = React.useRef<View>(null);
  const bottomNavRef = React.useRef<View>(null);
  const sideMenuDividoRef = React.useRef<View>(null);
  const dividoAddGroupRef = React.useRef<View>(null);
  
  // Get app context - this will work since AppContent is inside AppProvider
  const { state, dispatch } = useApp();
  
  // Ensure state is available before proceeding
  if (!state || !dispatch) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  // Preload critical assets to prevent glitching
  useEffect(() => {
    const preloadAssets = async () => {
      try {
        // Preload wallet icon used in loading screen - wrap in try-catch
        try {
          require('./assets/wallet.png');
        } catch (assetError) {
          console.warn('Asset preload failed, continuing anyway:', assetError);
        }
        // Give a small delay to ensure assets are cached
        await new Promise(resolve => setTimeout(resolve, 300));
        setAssetsReady(true);
      } catch (error) {
        // Asset preload failed, continue anyway
        console.warn('Asset preload error:', error);
        setAssetsReady(true);
      }
    };
    
    preloadAssets();
  }, []);

  // Show loading screen until assets are ready and minimum time has passed
  useEffect(() => {
    if (assetsReady) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800); // Reduced delay for faster app startup

      return () => clearTimeout(timer);
    }
  }, [assetsReady]);

  // Check if walkthrough should be shown (first time user)
  useEffect(() => {
    const checkWalkthrough = async () => {
      try {
        const walkthroughShown = await AsyncStorage.getItem('wally_walkthrough_shown');
        if (walkthroughShown !== 'true') {
          setShowWalkthrough(true);
        }
        setCheckingWalkthrough(false);
      } catch (error) {
        console.error('Error checking walkthrough:', error);
        setCheckingWalkthrough(false);
      }
    };
    
    if (!isLoading) {
      checkWalkthrough();
    }
  }, [isLoading]);

  const handleWalkthroughComplete = () => {
    setShowWalkthrough(false);
  };

  const handleWalkthroughSkip = () => {
    setShowWalkthrough(false);
  };


  // Handle Android back button
  useEffect(() => {
    if (!state || !dispatch) return;
    
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
      try {
        dispatch({ type: 'GO_BACK' });
        return true; // Prevent default back behavior
      } catch (error) {
        console.error('Error handling back button:', error);
        return false;
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [state?.currentScreen, isLoading, dispatch]);

  // Validate screen state and fix invalid screens using useEffect (not during render)
  useEffect(() => {
    if (!state || !state.currentScreen || isLoading) return;
    
    const currentScreen = state.currentScreen;
    let needsRedirect = false;
    let redirectTo: Screen = 'dashboard';
    
    // Screens that require specific data - validate and redirect if needed
    if (currentScreen === 'edit-transaction' && !state.selectedTransactionId) {
      console.warn('edit-transaction screen requires selectedTransactionId, redirecting to dashboard');
      needsRedirect = true;
      redirectTo = 'dashboard';
    } else if (currentScreen === 'expense-group-detail' && !state.selectedExpenseGroupId) {
      console.warn('expense-group-detail screen requires selectedExpenseGroupId, redirecting to divido');
      needsRedirect = true;
      redirectTo = 'divido';
    } else if (currentScreen === 'edit-expense' && !state.selectedExpenseId) {
      console.warn('edit-expense screen requires selectedExpenseId, redirecting to divido');
      needsRedirect = true;
      redirectTo = 'divido';
    } else if (currentScreen === 'edit-person' && !state.selectedPersonId) {
      console.warn('edit-person screen requires selectedPersonId, redirecting to people-list');
      needsRedirect = true;
      redirectTo = 'people-list';
    } else if (currentScreen === 'category-transactions' && !state.selectedCategory) {
      console.warn('category-transactions screen requires selectedCategory, redirecting to dashboard');
      needsRedirect = true;
      redirectTo = 'dashboard';
    } else {
      // Check for unknown/invalid screens
      const validScreens: Screen[] = ['dashboard', 'transactions', 'add-transaction', 'edit-transaction', 'categories', 'reports', 'settings', 'accounts', 'category-transactions', 'divido', 'expense-group-detail', 'add-expense-group', 'edit-expense-group', 'people-list', 'add-person', 'edit-person', 'add-expense', 'edit-expense', 'divido-settings'];
      if (!validScreens.includes(currentScreen)) {
        console.warn(`Unknown screen: ${currentScreen}, redirecting to dashboard`);
        needsRedirect = true;
        redirectTo = 'dashboard';
      }
    }
    
    if (needsRedirect) {
      dispatch({ type: 'SET_SCREEN', payload: redirectTo });
    }
  }, [state?.currentScreen, state?.selectedTransactionId, state?.selectedExpenseGroupId, state?.selectedExpenseId, state?.selectedPersonId, state?.selectedCategory, isLoading, dispatch]);

  const renderCurrentScreen = () => {
    if (!state || !state.currentScreen) {
      return <Dashboard floatingAddRef={floatingAddRef} menuButtonRef={menuButtonRef} />;
    }
    
    const currentScreen = state.currentScreen;
    
    // If screen is invalid, show dashboard while useEffect fixes it
    if ((currentScreen === 'edit-transaction' && !state.selectedTransactionId) ||
        (currentScreen === 'expense-group-detail' && !state.selectedExpenseGroupId) ||
        (currentScreen === 'edit-expense' && !state.selectedExpenseId) ||
        (currentScreen === 'edit-person' && !state.selectedPersonId) ||
        (currentScreen === 'category-transactions' && !state.selectedCategory)) {
      return <Dashboard 
        floatingAddRef={floatingAddRef} 
        menuButtonRef={menuButtonRef}
        onSideMenuVisibilityChange={setSideMenuVisible}
        sideMenuDividoRef={sideMenuDividoRef}
      />; // Show dashboard while redirect happens
    }
    
    try {
      switch (currentScreen) {
        case 'dashboard':
          return <Dashboard 
            floatingAddRef={floatingAddRef} 
            menuButtonRef={menuButtonRef}
            onSideMenuVisibilityChange={setSideMenuVisible}
            sideMenuDividoRef={sideMenuDividoRef}
          />;
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
        case 'divido-settings':
          return <DividoSettings />;
        case 'category-transactions':
          return <CategoryTransactions 
            categoryName={state.selectedCategory || ''}
            onBack={() => dispatch({ type: 'GO_BACK' })}
          />;
        // Divido screens
        case 'divido':
          return <Divido menuButtonRef={menuButtonRef} addGroupButtonRef={dividoAddGroupRef} />;
        case 'expense-group-detail':
          return <ExpenseGroupDetail />;
        case 'add-expense-group':
        case 'edit-expense-group':
          return <ExpenseGroupForm />;
        case 'people-list':
          return <PeopleList />;
        case 'add-person':
        case 'edit-person':
          return <PersonForm />;
        case 'add-expense':
        case 'edit-expense':
          return <ExpenseForm />;
        default:
          console.warn(`Unknown screen: ${currentScreen}, redirecting to dashboard`);
          return <Dashboard 
            floatingAddRef={floatingAddRef} 
            menuButtonRef={menuButtonRef}
            onSideMenuVisibilityChange={setSideMenuVisible}
            sideMenuDividoRef={sideMenuDividoRef}
          />;
      }
    } catch (error) {
      console.error(`Error rendering screen ${currentScreen}:`, error);
      return <Dashboard />;
    }
  };

  // Loading screen component
  const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        {(() => {
          try {
            return (
              <Image 
                source={require('./assets/wallet.png')} 
                style={styles.appIcon}
                resizeMode="contain"
              />
            );
          } catch (error) {
            // If image fails to load, show a placeholder
            return (
              <View style={[styles.appIcon, { backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#ffffff', fontSize: 32, fontWeight: 'bold' }}>W</Text>
              </View>
            );
          }
        })()}
        <Text style={styles.appTitle}>Wally</Text>
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
          >
            <View style={styles.screenContainer}>
              {renderCurrentScreen()}
            </View>
          </KeyboardAvoidingView>
          {state && state.currentScreen && !['divido', 'expense-group-detail', 'add-expense-group', 'edit-expense-group', 'people-list', 'add-person', 'edit-person', 'add-expense', 'edit-expense', 'divido-settings'].includes(state.currentScreen) && (
            <BottomNavigation bottomNavRef={bottomNavRef} />
          )}
          {state && state.currentScreen && ['divido', 'expense-group-detail', 'add-expense-group', 'edit-expense-group', 'people-list', 'add-person', 'edit-person', 'add-expense', 'edit-expense', 'divido-settings'].includes(state.currentScreen) && (
            <DividoBottomNavigation />
          )}
          
          {/* Walkthrough Overlay */}
          <WalkthroughOverlay
            visible={showWalkthrough && !checkingWalkthrough}
            currentScreen={state?.currentScreen || 'dashboard'}
            onComplete={handleWalkthroughComplete}
            onSkip={handleWalkthroughSkip}
            floatingAddRef={floatingAddRef}
            menuButtonRef={menuButtonRef}
            bottomNavRef={bottomNavRef}
            sideMenuDividoRef={sideMenuDividoRef}
            dividoAddGroupRef={dividoAddGroupRef}
            sideMenuVisible={sideMenuVisible}
          />
        </View>
      )}
    </SafeAreaProvider>
  );
}

// Minimal fallback component that doesn't depend on any context or imports
function MinimalFallback({ error }: { error?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
        Wally
      </Text>
      {error && (
        <Text style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', marginBottom: 16, fontFamily: 'monospace' }}>
          {error}
        </Text>
      )}
      <Text style={{ color: '#9ca3af', fontSize: 16, textAlign: 'center', marginBottom: 32 }}>
        Initializing app...
      </Text>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}

// Wrapper component that safely initializes the app
function SafeAppWrapper() {
  const [hasError, setHasError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [errorStack, setErrorStack] = React.useState<string>('');

  // Catch any errors during initialization
  React.useEffect(() => {
    const errorHandler = (error: Error) => {
      console.error('Error in SafeAppWrapper:', error);
      console.error('Error stack:', error.stack);
      setHasError(true);
      setErrorMessage(error.message || 'Unknown error');
      setErrorStack(error.stack || '');
    };

    // Set up error handler
    try {
      if (typeof ErrorUtils !== 'undefined' && ErrorUtils.getGlobalHandler) {
        const originalHandler = ErrorUtils.getGlobalHandler();
        if (originalHandler) {
          ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
            errorHandler(error);
            try {
              originalHandler(error, isFatal);
            } catch (e) {
              console.error('Error in original handler:', e);
            }
          });
        }
      }
    } catch (setupError) {
      console.error('Error setting up error handler:', setupError);
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleClearAndRestart = async () => {
    try {
      // Clear all storage - use dynamic import to avoid issues
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.clear();
        console.log('Storage cleared, restarting app...');
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
        // Continue anyway
      }
      
      // Reset error state
      setHasError(false);
      setErrorMessage('');
      setErrorStack('');
    } catch (error) {
      console.error('Error in handleClearAndRestart:', error);
      // Still try to reset
      setHasError(false);
      setErrorMessage('');
      setErrorStack('');
    }
  };

  if (hasError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#ef4444', fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
          Error
        </Text>
        <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
          {errorMessage}
        </Text>
        {__DEV__ && errorStack && (
          <ScrollView style={{ maxHeight: 200, width: '100%', backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <Text style={{ color: '#ef4444', fontSize: 10, fontFamily: 'monospace' }}>
              {errorStack.substring(0, 500)}
            </Text>
          </ScrollView>
        )}
        <TouchableOpacity 
          style={{ backgroundColor: '#ef4444', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, minWidth: 200, marginBottom: 12 }}
          onPress={handleClearAndRestart}
        >
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
            Clear Data & Restart
          </Text>
        </TouchableOpacity>
        <Text style={{ color: '#6b7280', fontSize: 12, textAlign: 'center' }}>
          This will clear all app data and restart
        </Text>
      </View>
    );
  }

  try {
    return (
      <ErrorBoundary>
        <AppProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </AppProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error rendering app:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    return <MinimalFallback error={`Render error: ${errorMsg}`} />;
  }
}

export default function App() {
  // Wrap everything in a try-catch at the top level
  try {
    return <SafeAppWrapper />;
  } catch (error) {
    console.error('Fatal error in App component:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return <MinimalFallback error={`Fatal: ${errorMsg}`} />;
  }
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
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    padding: 20,
  },
});