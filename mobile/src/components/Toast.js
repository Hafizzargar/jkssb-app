import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions, Platform } from 'react-native';
import { AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../utils/useTheme';

const ToastContext = createContext();

// Global reference for use outside of React components
let toastRef = null;

export const ToastProvider = ({ children }) => {
  const [toastData, setToastData] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-50)).current;
  const theme = useTheme();

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -50, duration: 300, useNativeDriver: true })
    ]).start(() => setToastData(null));
  }, [opacity, translateY]);

  const showToast = useCallback((message, type = 'error') => {
    console.log('Toast Triggered:', message, type);
    // Reset values first
    opacity.setValue(0);
    translateY.setValue(-50);
    setToastData({ message, type, id: Date.now() });
  }, [opacity, translateY]);

  // Set the global reference
  useEffect(() => {
    toastRef = showToast;
  }, [showToast]);

  useEffect(() => {
    if (toastData) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start();

      const timer = setTimeout(hideToast, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastData, opacity, translateY, hideToast]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toastData && (
        <Animated.View style={[
          styles.toastContainer, 
          { opacity, transform: [{ translateY }] },
          { backgroundColor: toastData.type === 'error' ? theme.colors.error : theme.colors.success }
        ]}>
          <View style={styles.content}>
            {toastData.type === 'error' ? <AlertCircle color="#fff" size={20} /> : <CheckCircle2 color="#fff" size={20} />}
            <Text style={styles.toastText}>{toastData.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

export const toast = (message, type = 'error') => {
  if (toastRef) {
    toastRef(message, type);
  } else {
    console.warn('Toast called but ToastProvider not ready:', message);
  }
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 40 : 60,
    right: Platform.OS === 'web' ? 40 : '5%',
    left: Platform.OS === 'web' ? 'auto' : '5%',
    width: Platform.OS === 'web' ? 350 : '90%',
    borderRadius: 16,
    zIndex: 999999, // Super high z-index
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 8,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  toastText: { color: '#fff', fontSize: 15, fontWeight: 'bold', flex: 1 },
});
