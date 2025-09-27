import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
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
  const { state } = useApp();

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

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#000000" />
      <View style={styles.container}>
        <View style={styles.content}>
          {renderCurrentScreen()}
          <BottomNavigation />
        </View>
      </View>
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
});