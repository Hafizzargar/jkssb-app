import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, TextInput, Modal, Switch, Platform } from 'react-native';
import { ChevronLeft, Plus, Trash2, BookOpen, Layers, Edit2 } from 'lucide-react-native';
import api from '../../utils/api';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';

import ConfirmModal from '../../components/ConfirmModal';

const AdminSubjectManage = ({ navigation }) => {
  const theme = useTheme();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });

  // Custom Confirmation Modal State
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/subject');
      setSubjects(res.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData({ name: '', code: '', description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name, code: subject.code, description: subject.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) return Alert.alert('Error', 'Name and Code are required');
    try {
      setLoading(true);
      if (editingSubject) {
        await api.put(`/api/admin/subject/${editingSubject._id}`, formData);
        Alert.alert('Success', 'Subject updated successfully');
      } else {
        await api.post('/api/admin/subject', formData);
        Alert.alert('Success', 'Subject added successfully');
      }
      setShowModal(false);
      setFormData({ name: '', code: '', description: '' });
      fetchSubjects();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/api/admin/subject/toggle/${id}`);
      setSubjects(subjects.map(s => s._id === id ? { ...s, isActive: !s.isActive } : s));
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle status');
    }
  };

  const handleDelete = (id) => {
    setSubjectToDelete(id);
    setConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (!subjectToDelete) return;
    try {
      await api.delete(`/api/admin/subject/${subjectToDelete}`);
      setSubjects(prev => prev.filter(s => s._id !== subjectToDelete));
      Alert.alert('Deleted', 'Subject has been removed.');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete');
    } finally {
      setConfirmVisible(false);
      setSubjectToDelete(null);
    }
  };

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Subject Management</Text>
          <Text style={s.headerSub}>{subjects.length} Categories Configured</Text>
        </View>
        <TouchableOpacity style={s.plusBtn} onPress={handleOpenAdd}>
          <Plus color="#000" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {loading && subjects.length === 0 ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : subjects.length === 0 ? (
          <View style={s.emptyState}>
            <Layers color={theme.colors.textMuted} size={48} />
            <Text style={s.emptyText}>No subjects created yet</Text>
            <TouchableOpacity style={s.addBtnLarge} onPress={handleOpenAdd}>
              <Text style={s.addBtnLargeText}>Add Your First Subject</Text>
            </TouchableOpacity>
          </View>
        ) : (
          subjects.map((sub) => (
            <View key={sub._id} style={[s.card, !sub.isActive && s.cardDisabled]}>
              <View style={s.cardInfo}>
                <View style={[s.iconBox, { backgroundColor: sub.isActive ? `${theme.colors.primary}20` : `${theme.colors.textMuted}20` }]}>
                  <BookOpen color={sub.isActive ? theme.colors.primary : theme.colors.textMuted} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.titleRow}>
                    <Text style={s.cardName}>{sub.name}</Text>
                    <View style={s.codeBadge}>
                      <Text style={s.codeText}>{sub.code}</Text>
                    </View>
                  </View>
                  <Text style={s.cardDesc} numberOfLines={1}>{sub.description || 'No description provided'}</Text>
                </View>
                <TouchableOpacity style={s.editBtn} onPress={() => handleOpenEdit(sub)}>
                  <Edit2 color={theme.colors.textMuted} size={18} />
                </TouchableOpacity>
              </View>
              
              <View style={s.cardActions}>
                <View style={s.toggleBox}>
                  <Text style={s.toggleLabel}>{sub.isActive ? 'Active' : 'Disabled'}</Text>
                  <Switch 
                    value={sub.isActive} 
                    onValueChange={() => handleToggle(sub._id)}
                    trackColor={{ false: '#767577', true: theme.colors.primary }}
                    thumbColor={sub.isActive ? '#fff' : '#f4f3f4'}
                  />
                </View>
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(sub._id)}>
                  <Trash2 color={theme.colors.error} size={20} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={{ color: theme.colors.textMuted }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={s.modalBody}>
              <Text style={s.label}>Subject Name</Text>
              <TextInput 
                style={s.input} 
                placeholder="e.g. Accountancy" 
                placeholderTextColor={theme.colors.textMuted}
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
              />

              <Text style={s.label}>Subject Code (Short)</Text>
              <TextInput 
                style={s.input} 
                placeholder="e.g. ACC" 
                placeholderTextColor={theme.colors.textMuted}
                value={formData.code}
                onChangeText={(t) => setFormData({ ...formData, code: t })}
              />

              <Text style={s.label}>Description (Optional)</Text>
              <TextInput 
                style={[s.input, { height: 80, textAlignVertical: 'top' }]} 
                placeholder="What is this subject about?" 
                placeholderTextColor={theme.colors.textMuted}
                value={formData.description}
                onChangeText={(t) => setFormData({ ...formData, description: t })}
                multiline
              />

              <TouchableOpacity style={s.submitBtn} onPress={handleSubmit}>
                <Text style={s.submitBtnText}>{editingSubject ? 'Update Subject' : 'Create Subject'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal 
        visible={confirmVisible}
        title="Delete Subject"
        message="Are you sure you want to remove this category? All performance data linked to this subject for students will be disconnected."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmVisible(false)}
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { marginRight: 12 },
  headerTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: theme.colors.primary, fontSize: 11, fontWeight: '600' },
  plusBtn: { backgroundColor: theme.colors.primary, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: spacing.lg },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: theme.colors.textMuted, marginTop: 12, marginBottom: 24 },
  addBtnLarge: { backgroundColor: `${theme.colors.primary}20`, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.primary },
  addBtnLargeText: { color: theme.colors.primary, fontWeight: 'bold' },
  card: { backgroundColor: theme.colors.surface, borderRadius: borderRadius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  cardDisabled: { opacity: 0.6 },
  cardInfo: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flex: 1 },
  cardName: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' },
  codeBadge: { backgroundColor: `${theme.colors.primary}15`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  codeText: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold' },
  cardDesc: { color: theme.colors.textMuted, fontSize: 12 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 },
  toggleBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  deleteBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.colors.error}10` },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 14, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
  submitBtn: { backgroundColor: theme.colors.primary, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  submitBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  editBtn: { padding: 8 },
  fullLoadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10 }
});

export default AdminSubjectManage;
