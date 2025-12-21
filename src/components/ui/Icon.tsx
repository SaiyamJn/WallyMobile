import React, { useState, useEffect } from 'react';
import { Text, Image, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { getIconSource, getEmojiFallback, shouldUseAsset, hasIcon, IconName } from '../../utils/iconUtils';
import { ICON_SIZES } from '../../constants/iconSizes';

// Determine which icons should have tinting applied
// Navigation icons and colored icons typically don't work well with tinting
const shouldApplyTinting = (iconName: string): boolean => {
  const noTintingIcons = [
    // Navigation icons (excluding dashboard to allow white tinting)
    'transactions', 'accounts', 'reports', 'settings',
    // Colored icons that should maintain their original colors
    'wallet', 'total_balance', 'income_arrow', 'expense_arrow',
    'card', 'food', 'car', 'plane', 'bank', 'diamond', 'target', 'rocket', 'star',
    'lock', 'briefcase', 'home', 'game', 'book', 'palette', 'music',
    'shopping', 'movie', 'lightning', 'hospital', 'laptop', 'pizza', 'coffee',
    'popcorn', 'chart', 'divido', 'people', 'groups',
    // Action icons that should maintain their original appearance
    'edit', 'delete', 'save', 'cancel', 'up', 'down'
  ];
  
  return !noTintingIcons.includes(iconName);
};

interface IconProps {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: ViewStyle | TextStyle;
}

export function Icon({ name, size = ICON_SIZES.LG, color, style }: IconProps) {
  const [imageError, setImageError] = useState(false);
  const useAsset = shouldUseAsset(name);
  
  // Reset error state when name changes
  useEffect(() => {
    setImageError(false);
  }, [name]);
  
  // Try to use asset if available and enabled
  if (useAsset && typeof name === 'string' && !imageError) {
    try {
      // Check if icon exists before trying to get source
      if (hasIcon(name)) {
        const iconSource = getIconSource(name as IconName);
        return (
          <Image
            key={`icon-${name}-${size}`}
            source={iconSource}
            style={[
              styles.icon,
              { width: size, height: size },
              // Only apply tinting for specific icons that work well with it
              color && shouldApplyTinting(name) && { tintColor: color },
              style
            ]}
            resizeMode="contain"
            onError={() => {
              // Fall back to emoji on image load error
              setImageError(true);
            }}
            onLoad={() => {
              // Reset error state on successful load
              setImageError(false);
            }}
          />
        );
      }
    } catch (error) {
      // If asset fails, fall back to emoji
      console.warn(`Icon asset error for ${name}:`, error);
    }
  }
  
  // Use emoji fallback
  const emoji = getEmojiFallback(name);
  return (
    <Text
      style={[
        styles.emoji,
        { fontSize: size },
        color && { color },
        style
      ]}
    >
      {emoji}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    // Image styles
  },
  emoji: {
    textAlign: 'center',
    lineHeight: undefined, // Reset line height for emoji
  },
});
