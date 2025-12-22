import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Dimensions, LayoutChangeEvent } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WalkthroughStep {
  id: string;
  target: 'floating-add' | 'menu-button' | 'bottom-navigation' | 'side-menu-divido' | 'divido-add-group' | 'info-note';
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  screen: 'dashboard' | 'divido';
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: '1',
    target: 'floating-add',
    title: 'Add Transactions',
    description: 'Tap the + button to quickly add income or expenses',
    position: 'top',
    screen: 'dashboard',
  },
  {
    id: '2',
    target: 'menu-button',
    title: 'Open Menu',
    description: 'Tap here to access all features',
    position: 'bottom',
    screen: 'dashboard',
  },
  {
    id: '3',
    target: 'bottom-navigation',
    title: 'Bottom Navigation',
    description: 'Quick access: Dashboard (home), Transactions (view all), Accounts (manage), Reports (analytics), Settings (preferences)',
    position: 'top',
    screen: 'dashboard',
  },
  {
    id: '4',
    target: 'info-note',
    title: 'Divido - Split Expenses',
    description: 'Access Divido from the side menu (☰) to split expenses with friends and track who owes what. Perfect for group trips, shared bills, and splitting costs!',
    position: 'center',
    screen: 'dashboard',
  },
  {
    id: '5',
    target: 'divido-add-group',
    title: 'Create Expense Group',
    description: 'Start splitting expenses by creating a new group',
    position: 'top',
    screen: 'divido',
  },
];

interface WalkthroughOverlayProps {
  visible: boolean;
  currentScreen: string;
  onComplete: () => void;
  onSkip: () => void;
  // Refs for elements to highlight
  floatingAddRef?: React.RefObject<View>;
  menuButtonRef?: React.RefObject<View>;
  bottomNavRef?: React.RefObject<View>;
  sideMenuDividoRef?: React.RefObject<View>;
  dividoAddGroupRef?: React.RefObject<View>;
  sideMenuVisible?: boolean;
}

export function WalkthroughOverlay({
  visible,
  currentScreen,
  onComplete,
  onSkip,
  floatingAddRef,
  menuButtonRef,
  bottomNavRef,
  sideMenuDividoRef,
  dividoAddGroupRef,
  sideMenuVisible = false,
}: WalkthroughOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetLayout, setTargetLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const currentStep = WALKTHROUGH_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === WALKTHROUGH_STEPS.length - 1;

  // Filter steps based on current screen
  const relevantSteps = WALKTHROUGH_STEPS.filter(step => {
    if (step.screen === 'dashboard' && currentScreen === 'dashboard') return true;
    if (step.screen === 'divido' && currentScreen === 'divido') return true;
    // Show side menu steps only when side menu is visible
    if (step.target === 'side-menu-divido' && !sideMenuVisible) return false;
    return false;
  });

  useEffect(() => {
    if (visible && relevantSteps.length > 0) {
      // Reset to first relevant step
      const firstRelevantIndex = WALKTHROUGH_STEPS.findIndex(s => s.id === relevantSteps[0].id);
      setCurrentStepIndex(firstRelevantIndex);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Start pulsing animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      return () => pulse.stop();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      pulseAnim.setValue(1);
    }
  }, [visible, relevantSteps.length]);

  // Measure target element position
  useEffect(() => {
    if (!visible || !currentStep) return;

    const measureTarget = () => {
      // For info-note, we don't need to measure anything - just set a dummy layout
      if (currentStep.target === 'info-note') {
        setTargetLayout({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2, width: 0, height: 0 });
        return;
      }

      let ref: React.RefObject<View> | undefined;
      
      switch (currentStep.target) {
        case 'floating-add':
          ref = floatingAddRef;
          break;
        case 'menu-button':
          ref = menuButtonRef;
          break;
        case 'bottom-navigation':
          ref = bottomNavRef;
          break;
        case 'side-menu-divido':
          ref = sideMenuDividoRef;
          break;
        case 'divido-add-group':
          ref = dividoAddGroupRef;
          break;
      }

      if (ref?.current) {
        ref.current.measureInWindow((x, y, width, height) => {
          setTargetLayout({ x, y, width, height });
        });
      } else {
        // Fallback positions if refs not available
        const fallbackPositions: Record<string, { x: number; y: number; width: number; height: number }> = {
          'floating-add': { x: SCREEN_WIDTH - 80, y: SCREEN_HEIGHT - 100, width: 56, height: 56 },
          'menu-button': { x: 16, y: 60, width: 40, height: 40 },
          'bottom-navigation': { x: 0, y: SCREEN_HEIGHT - 60, width: SCREEN_WIDTH, height: 60 },
          'side-menu-divido': { x: 20, y: 300, width: 280, height: 80 },
          'divido-add-group': { x: SCREEN_WIDTH / 2 - 100, y: SCREEN_HEIGHT - 150, width: 200, height: 50 },
        };
        setTargetLayout(fallbackPositions[currentStep.target] || { x: 0, y: 0, width: 0, height: 0 });
      }
    };

    // Small delay to ensure layout is ready
    const timer = setTimeout(measureTarget, 100);
    return () => clearTimeout(timer);
  }, [visible, currentStep, floatingAddRef, menuButtonRef, bottomNavRef, sideMenuDividoRef, dividoAddGroupRef, sideMenuVisible]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      // Find next relevant step
      const currentRelevantIndex = relevantSteps.findIndex(s => s.id === currentStep.id);
      if (currentRelevantIndex < relevantSteps.length - 1) {
        const nextStep = relevantSteps[currentRelevantIndex + 1];
        const nextIndex = WALKTHROUGH_STEPS.findIndex(s => s.id === nextStep.id);
        setCurrentStepIndex(nextIndex);
      } else {
        handleComplete();
      }
    }
  };

  const handlePrevious = () => {
    const currentRelevantIndex = relevantSteps.findIndex(s => s.id === currentStep.id);
    if (currentRelevantIndex > 0) {
      const prevStep = relevantSteps[currentRelevantIndex - 1];
      const prevIndex = WALKTHROUGH_STEPS.findIndex(s => s.id === prevStep.id);
      if (prevIndex !== -1) {
        setCurrentStepIndex(prevIndex);
      }
    }
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('wally_walkthrough_shown', 'true');
    } catch (error) {
      console.error('Error saving walkthrough status:', error);
    }
    onComplete();
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('wally_walkthrough_shown', 'true');
    } catch (error) {
      console.error('Error saving walkthrough status:', error);
    }
    onSkip();
  };

  if (!visible || relevantSteps.length === 0 || !currentStep) {
    return null;
  }

  // Calculate spotlight size - use the larger dimension and add padding
  const targetWidth = targetLayout?.width || 60;
  const targetHeight = targetLayout?.height || 60;
  const maxDimension = Math.max(targetWidth, targetHeight);
  const spotlightRadius = Math.ceil(maxDimension / 2 + 16); // Increased padding, rounded up for perfect circle
  const spotlightX = (targetLayout?.x || 0) + targetWidth / 2;
  const spotlightY = (targetLayout?.y || 0) + targetHeight / 2;
  
  // Ensure perfect circle dimensions - use even numbers
  const spotlightSize = spotlightRadius * 2;
  
  // For info-note, don't show spotlight
  const showSpotlight = currentStep.target !== 'info-note';

  // Calculate tooltip position based on step position preference
  let tooltipX = 0;
  let tooltipY = 0;
  let arrowPosition: 'top' | 'bottom' | 'left' | 'right' | null = currentStep.position === 'center' ? null : currentStep.position;

  if (currentStep.target === 'info-note') {
    // Center the tooltip for info notes
    tooltipX = SCREEN_WIDTH / 2;
    tooltipY = SCREEN_HEIGHT / 2;
    arrowPosition = null;
  } else if (targetLayout) {
    switch (currentStep.position) {
      case 'top':
        tooltipX = spotlightX;
        tooltipY = spotlightY - spotlightRadius - 120;
        arrowPosition = 'bottom';
        break;
      case 'bottom':
        tooltipX = spotlightX;
        tooltipY = spotlightY + spotlightRadius + 120;
        arrowPosition = 'top';
        break;
      case 'left':
        tooltipX = spotlightX - spotlightRadius - 150;
        tooltipY = spotlightY;
        arrowPosition = 'right';
        break;
      case 'right':
        tooltipX = spotlightX + spotlightRadius + 150;
        tooltipY = spotlightY;
        arrowPosition = 'left';
        break;
      case 'center':
        tooltipX = SCREEN_WIDTH / 2;
        tooltipY = SCREEN_HEIGHT / 2;
        arrowPosition = null;
        break;
    }
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onSkip}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Dark overlay with spotlight hole */}
        <View style={styles.overlay}>
          {targetLayout && showSpotlight && (
            <Animated.View
              style={[
                styles.spotlightContainer,
                {
                  left: spotlightX - spotlightRadius - 4,
                  top: spotlightY - spotlightRadius - 4,
                  width: spotlightSize + 8,
                  height: spotlightSize + 8,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Svg width={spotlightSize + 8} height={spotlightSize + 8}>
                <Circle
                  cx={(spotlightSize + 8) / 2}
                  cy={(spotlightSize + 8) / 2}
                  r={(spotlightSize + 8) / 2 - 1.25}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                />
              </Svg>
            </Animated.View>
          )}
        </View>

        {/* Tooltip */}
        {targetLayout && (
          <View
            style={[
              styles.tooltip,
              {
                left: Math.max(20, Math.min(tooltipX - 140, SCREEN_WIDTH - 300)),
                top: Math.max(20, Math.min(tooltipY - 60, SCREEN_HEIGHT - 200)),
              },
            ]}
          >
            {/* Arrow pointing to target - only show if arrowPosition is not null */}
            {arrowPosition && (
              <View
                style={[
                  styles.arrow,
                  styles[`arrow${arrowPosition.charAt(0).toUpperCase() + arrowPosition.slice(1)}` as keyof typeof styles],
                ]}
              />
            )}

            <Text style={styles.tooltipTitle}>{currentStep.title}</Text>
            <Text style={styles.tooltipDescription}>{currentStep.description}</Text>

            {/* Navigation buttons */}
            <View style={styles.tooltipActions}>
              <TouchableOpacity 
                style={styles.skipButton} 
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
              <View style={styles.navButtons}>
                {(() => {
                  const currentRelevantIndex = relevantSteps.findIndex(s => s.id === currentStep.id);
                  return currentRelevantIndex > 0 ? (
                    <TouchableOpacity 
                      style={styles.navButton} 
                      onPress={handlePrevious}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.navButtonText}>Previous</Text>
                    </TouchableOpacity>
                  ) : null;
                })()}
                <TouchableOpacity 
                  style={[styles.navButton, styles.navButtonPrimary]} 
                  onPress={handleNext}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navButtonText, styles.navButtonPrimaryText]}>
                    {isLastStep ? 'Got it!' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Step indicator */}
            <View style={styles.stepIndicator}>
              {relevantSteps.map((_, index) => {
                const stepIndex = WALKTHROUGH_STEPS.findIndex(s => s.id === relevantSteps[index].id);
                const isActive = stepIndex === currentStepIndex;
                return (
                  <View
                    key={index}
                    style={[styles.stepDot, isActive && styles.stepDotActive]}
                  />
                );
              })}
            </View>
          </View>
        )}

      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
  },
  spotlightContainer: {
    position: 'absolute',
    backgroundColor: 'transparent',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 15,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    width: 280,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  tooltipCentered: {
    transform: [{ translateX: -140 }, { translateY: -100 }],
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  },
  arrowTop: {
    top: -10,
    left: '50%',
    marginLeft: -10,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1a1a1a',
  },
  arrowBottom: {
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1a1a1a',
  },
  arrowLeft: {
    left: -10,
    top: '50%',
    marginTop: -10,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#1a1a1a',
  },
  arrowRight: {
    right: -10,
    top: '50%',
    marginTop: -10,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#1a1a1a',
  },
  tooltipTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  tooltipDescription: {
    fontSize: 14,
    color: '#b0b0b0',
    lineHeight: 20,
    marginBottom: 20,
  },
  tooltipActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 20,
  },
  skipButtonText: {
    color: '#8b8b8b',
    fontSize: 14,
    fontWeight: '500',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
    zIndex: 20,
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    zIndex: 20,
  },
  navButtonPrimary: {
    backgroundColor: '#3b82f6',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  navButtonPrimaryText: {
    color: '#ffffff',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3a3a3a',
  },
  stepDotActive: {
    backgroundColor: '#3b82f6',
    width: 20,
  },
  clickableArea: {
    ...StyleSheet.absoluteFillObject,
  },
});

