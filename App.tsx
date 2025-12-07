import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Text, ActivityIndicator, Image, BackHandler, KeyboardAvoidingView, Platform } from 'react-native';
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

function AppContent() {
  const { state, dispatch } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [assetsReady, setAssetsReady] = useState(false);

  // Preload critical assets to prevent glitching
  useEffect(() => {
    const preloadAssets = async () => {
      try {
        // Preload wallet icon used in loading screen
        require('./assets/wallet.png');
        // Give a small delay to ensure assets are cached
        await new Promise(resolve => setTimeout(resolve, 500));
        setAssetsReady(true);
      } catch (error) {
        // Asset preload failed, continue anyway
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
      }, 1500); // Reduced from 2000 to 1500 since we're preloading

      return () => clearTimeout(timer);
    }
  }, [assetsReady]);


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