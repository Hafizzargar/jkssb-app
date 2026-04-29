import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../utils/useTheme';

const Input = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry, 
  icon: Icon,
  error,
  editable = true,
  maxLength,
  keyboardType = 'default',
  containerStyle,
  style,
  ...props 
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>}
      
      <View style={[
        styles.inputWrapper, 
        { 
          backgroundColor: editable ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
          borderColor: error ? theme.colors.error : (isFocused ? theme.colors.primary : theme.colors.border),
          borderStyle: editable ? 'solid' : 'dashed'
        }
      ]}>
        {Icon && <Icon size={18} color={isFocused ? theme.colors.primary : theme.colors.textMuted} style={styles.leftIcon} />}
        
        <TextInput
          style={[styles.input, { color: theme.colors.text }, style]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder || theme.colors.textMuted}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
          maxLength={maxLength}
          keyboardType={keyboardType}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIcon}
          >
            {isPasswordVisible ? (
              <EyeOff size={18} color={theme.colors.textMuted} />
            ) : (
              <Eye size={18} color={theme.colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '500',
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
  },
  errorText: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default Input;
