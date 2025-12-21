import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = async () => {
    try {
      // Try to clear storage before resetting to prevent the same error
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.clear();
        console.log('Storage cleared successfully');
      } catch (clearError) {
        console.error('Error clearing storage:', clearError);
        // Continue anyway
      }
      
      // Reset error state - this will cause the component tree to re-render
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    } catch (error) {
      console.error('Error in handleReset:', error);
      // Force reset even if setState fails
      try {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null
        });
      } catch (resetError) {
        console.error('Critical error in handleReset, cannot recover:', resetError);
      }
    }
  };

  handleClearAndReset = async () => {
    try {
      // Clear all storage
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.clear();
        console.log('Storage cleared successfully');
      } catch (clearError) {
        console.error('Error clearing storage:', clearError);
      }
      
      // Reset error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    } catch (error) {
      console.error('Error in handleClearAndReset:', error);
      // Still try to reset
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              The app encountered an unexpected error. Please try restarting the app.
            </Text>
            {this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.error.stack && (
                  <Text style={styles.errorInfo}>
                    {this.state.error.stack.substring(0, 500)}
                  </Text>
                )}
                {this.state.errorInfo && (
                  <Text style={styles.errorInfo}>
                    {this.state.errorInfo.componentStack?.substring(0, 500)}
                  </Text>
                )}
              </View>
            )}
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={this.handleClearAndReset}>
              <Text style={styles.buttonText}>Clear Data & Restart</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  errorInfo: {
    fontSize: 10,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
