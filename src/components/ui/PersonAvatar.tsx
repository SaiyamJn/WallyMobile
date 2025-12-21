import React from 'react';
import { Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Icon } from './Icon';
import { isAvatar, getAvatarSource } from '../../utils/iconUtils';
import { ICON_SIZES } from '../../constants/iconSizes';

interface PersonAvatarProps {
  icon: string;
  size?: number;
  color?: string;
  style?: ViewStyle | ImageStyle;
}

export function PersonAvatar({ icon, size = ICON_SIZES.SM, color, style }: PersonAvatarProps) {
  // Check if it's an avatar (starts with 'av')
  if (isAvatar(icon)) {
    const avatarSource = getAvatarSource(icon);
    return (
      <Image
        source={avatarSource}
        style={[
          styles.avatar,
          { width: size, height: size },
          style
        ]}
        resizeMode="cover"
      />
    );
  }
  
  // Fall back to Icon component for legacy icons
  return <Icon name={icon as any} size={size} color={color} style={style} />;
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 0, // Avatars are already circular images
    overflow: 'hidden',
  },
});
