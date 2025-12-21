import { registerRootComponent } from 'expo';
import { ErrorUtils } from 'react-native';

import App from './App';

// Global error handler for unhandled errors (if available)
try {
  if (ErrorUtils && typeof ErrorUtils.getGlobalHandler === 'function') {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      console.error('Global error handler caught error:', error);
      console.error('Error stack:', error.stack);
      console.error('Is fatal:', isFatal);
      
      // Try to prevent crashes for non-fatal errors
      if (!isFatal) {
        console.warn('Non-fatal error, attempting to continue...');
      }
      
      // Call original handler to maintain default behavior
      if (originalHandler) {
        try {
          originalHandler(error, isFatal);
        } catch (handlerError) {
          console.error('Error in original error handler:', handlerError);
        }
      }
    });
  }
} catch (error) {
  console.warn('Could not set global error handler:', error);
}

// Handle unhandled promise rejections (if available)
try {
  if (typeof global !== 'undefined' && global) {
    const originalUnhandledRejection = (global as any).onunhandledrejection;
    (global as any).onunhandledrejection = (event: any) => {
      console.error('Unhandled promise rejection:', event?.reason || event);
      // Prevent default behavior that might crash the app
      if (event?.preventDefault) {
        event.preventDefault();
      }
      if (originalUnhandledRejection) {
        originalUnhandledRejection(event);
      }
    };
  }
} catch (error) {
  console.warn('Could not set unhandled rejection handler:', error);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
