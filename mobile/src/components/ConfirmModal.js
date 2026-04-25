import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';
import { useTheme } from '../utils/useTheme';
import { spacing, borderRadius } from '../theme';

const ConfirmModal = ({ visible, title, message, onConfirm, onCancel, confirmText = 'Delete', cancelText = 'Cancel', type = 'danger' }) => {
  const theme = useTheme();
  const s = styles(theme);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.content}>
          <View style={s.header}>
            <View style={[s.iconBox, { backgroundColor: type === 'danger' ? `${theme.colors.error}20` : `${theme.colors.primary}20` }]}>
              <AlertTriangle color={type === 'danger' ? theme.colors.error : theme.colors.primary} size={24} />
            </View>
            <TouchableOpacity onPress={onCancel} style={s.closeBtn}>
              <X color={theme.colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          <View style={s.body}>
            <Text style={s.title}>{title}</Text>
            <Text style={s.message}>{message}</Text>
          </View>

          <View style={s.footer}>
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
              <Text style={s.cancelBtnText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[s.confirmBtn, { backgroundColor: type === 'danger' ? theme.colors.error : theme.colors.primary }]} 
              onPress={onConfirm}
            >
              <Text style={[s.confirmBtnText, { color: type === 'danger' ? '#fff' : '#000' }]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = (theme) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { 
    backgroundColor: theme.colors.surface, 
    borderRadius: 24, 
    width: '100%', 
    maxWidth: 400, 
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 20
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  iconBox: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { padding: 4 },
  body: { marginBottom: 32 },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  message: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20 },
  footer: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: theme.colors.border },
  cancelBtnText: { color: theme.colors.text, fontWeight: '600' },
  confirmBtn: { flex: 2, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { fontWeight: 'bold', fontSize: 16 }
});

export default ConfirmModal;
