import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors } from '@/constants/colors';

interface ButtonProps {
  children?: React.ReactNode;
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left'
}) => {
  const getContainerStyle = () => {
    let containerStyle: ViewStyle = {};
    
    // Variant styles
    switch (variant) {
      case 'primary':
        containerStyle = {
          backgroundColor: colors.primary,
        };
        break;
      case 'secondary':
        containerStyle = {
          backgroundColor: colors.secondary,
        };
        break;
      case 'outline':
        containerStyle = {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary,
        };
        break;
      case 'ghost':
        containerStyle = {
          backgroundColor: 'transparent',
        };
        break;
    }
    
    // Size styles
    switch (size) {
      case 'small':
        containerStyle = {
          ...containerStyle,
          paddingVertical: 8,
          paddingHorizontal: 16,
        };
        break;
      case 'medium':
        containerStyle = {
          ...containerStyle,
          paddingVertical: 12,
          paddingHorizontal: 24,
        };
        break;
      case 'large':
        containerStyle = {
          ...containerStyle,
          paddingVertical: 16,
          paddingHorizontal: 32,
        };
        break;
    }
    
    // Disabled style
    if (disabled || isLoading) {
      containerStyle = {
        ...containerStyle,
        opacity: 0.6,
      };
    }
    
    return containerStyle;
  };
  
  const getTextStyle = () => {
    let textStyleObj: TextStyle = {};
    
    switch (variant) {
      case 'primary':
      case 'secondary':
        textStyleObj = {
          color: '#FFFFFF',
        };
        break;
      case 'outline':
      case 'ghost':
        textStyleObj = {
          color: colors.primary,
        };
        break;
    }
    
    switch (size) {
      case 'small':
        textStyleObj = {
          ...textStyleObj,
          fontSize: 14,
        };
        break;
      case 'medium':
        textStyleObj = {
          ...textStyleObj,
          fontSize: 16,
        };
        break;
      case 'large':
        textStyleObj = {
          ...textStyleObj,
          fontSize: 18,
        };
        break;
    }
    
    return textStyleObj;
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        getContainerStyle(),
        style
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : colors.primary} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {title ? (
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          ) : children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    fontWeight: '600',
  }
});