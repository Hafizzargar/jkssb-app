import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, TextInput, Modal, Switch, Platform } from 'react-native';
import { ChevronLeft, Plus, Trash2, BookOpen, Layers, Edit2, Sparkles } from 'lucide-react-native';
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

  const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' | 'modes'
  const [testModes, setTestModes] = useState([]);

  const [showModeModal, setShowModeModal] = useState(false);
  const [editingMode, setEditingMode] = useState(null);

  const handleOpenEditMode = (mode) => {
    setEditingMode(JSON.parse(JSON.stringify(mode))); // Deep clone
    setShowModeModal(true);
  };

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData({ name: '', code: '', description: '' });
    setShowModal(true);
  };

  const handleOpenAddPattern = () => {
    setEditingMode({
      label: '',
      total: 0,
      duration: 180,
      sections: [
        { name: 'Physics', count: 0 },
        { name: 'Chemistry', count: 0 },
        { name: 'Biology', count: 0 }
      ]
    });
    setShowModeModal(true);
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/subject');
      setSubjects(res.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatterns = async () => {
    try {
      const res = await api.get('/admin/pattern');
      setTestModes(res.data);
    } catch (error) {
      // Failed silently for clean UI
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchPatterns();
  }, []);

  const handleUpdateMode = async () => {
    if (!editingMode.label) return Alert.alert('Error', 'Please provide a pattern name');
    const total = editingMode.sections.reduce((acc, s) => acc + (parseInt(s.count) || 0), 0);
    const modeData = { ...editingMode, total };
    
    try {
      setLoading(true);
      if (editingMode._id) {
        await api.put(`/admin/pattern/${editingMode._id}`, modeData);
      } else {
        await api.post('/admin/pattern', modeData);
      }
      setShowModeModal(false);
      fetchPatterns();
      Alert.alert('Success', 'Exam pattern saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save pattern');
    } finally {
      setLoading(false);
    }
  };

  const handleModeSectionChange = (index, value) => {
    const newSections = [...editingMode.sections];
    newSections[index].count = parseInt(value) || 0;
    setEditingMode({ ...editingMode, sections: newSections });
  };

  const handleDeletePattern = async (id) => {
    try {
      await api.delete(`/admin/pattern/${id}`);
      fetchPatterns();
      Alert.alert('Deleted', 'Pattern removed');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete pattern');
    }
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
        await api.put(`/admin/subject/${editingSubject._id}`, formData);
        Alert.alert('Success', 'Subject updated successfully');
      } else {
        await api.post('/admin/subject', formData);
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
      await api.patch(`/admin/subject/toggle/${id}`);
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
      await api.delete(`/admin/subject/${subjectToDelete}`);
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
        <View style={{ flex: 1 }} />
        <TouchableOpacity 
          style={s.plusBtn} 
          onPress={activeTab === 'subjects' ? handleOpenAdd : handleOpenAddPattern}
        >
          <Plus color="#000" size={20} />
        </TouchableOpacity>
      </View>

      <View style={s.tabBar}>
        <TouchableOpacity 
          style={[s.tab, activeTab === 'subjects' && s.activeTab]} 
          onPress={() => setActiveTab('subjects')}
        >
          <Text style={[s.tabText, activeTab === 'subjects' && s.activeTabText]}>Subjects</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.tab, activeTab === 'modes' && s.activeTab]} 
          onPress={() => setActiveTab('modes')}
        >
          <Text style={[s.tabText, activeTab === 'modes' && s.activeTabText]}>Test Patterns</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'subjects' ? (
          loading && subjects.length === 0 ? (
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
            <>
              {subjects.map((sub) => (
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
              ))}
              <TouchableOpacity 
                style={[s.modeCard, s.modeCardAdd, { marginTop: 10 }]} 
                onPress={handleOpenAdd}
              >
                <Plus color={theme.colors.primary} size={24} />
                <Text style={s.modeAddText}>Add New Subject</Text>
                <Text style={s.modeAddSub}>Define a new category for MCQs</Text>
              </TouchableOpacity>
            </>
          )
        ) : (
          /* Test Modes Content */
          <>
            {testModes.map((mode) => (
              <View key={mode._id || mode.id} style={s.modeCard}>
                <View style={s.modeHeader}>
                  <Sparkles color={theme.colors.primary} size={20} />
                  <TouchableOpacity onPress={() => handleDeletePattern(mode._id)} style={s.modeDeleteBtn}>
                    <Trash2 color={theme.colors.error} size={16} />
                  </TouchableOpacity>
                  <Text style={s.modeTitle} numberOfLines={1}>{mode.label}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <View style={[s.totalBadge, { backgroundColor: 'rgba(52, 211, 153, 0.1)' }]}>
                      <Text style={[s.totalText, { color: '#34d399' }]}>{mode.duration} Min</Text>
                    </View>
                    <View style={s.totalBadge}>
                      <Text style={s.totalText}>{mode.total} Qs</Text>
                    </View>
                  </View>
                </View>
                
                <View style={s.modeDistribution}>
                  {mode.sections.map((sec, si) => (
                    <View key={si} style={s.distItem}>
                      <Text style={s.distName}>{sec.name}</Text>
                      <View style={s.distLine} />
                      <Text style={s.distCount}>{sec.count}</Text>
                    </View>
                  ))}
                </View>
                
                <TouchableOpacity style={s.modeEditBtn} onPress={() => handleOpenEditMode(mode)}>
                  <Edit2 color={theme.colors.primary} size={16} />
                  <Text style={s.modeEditText}>Edit Distribution</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity 
              style={[s.modeCard, s.modeCardAdd]} 
              onPress={handleOpenAddPattern}
            >
              <Plus color={theme.colors.primary} size={24} />
              <Text style={s.modeAddText}>Create New Test Pattern</Text>
              <Text style={s.modeAddSub}>Define custom distribution for NEET</Text>
            </TouchableOpacity>
          </>
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

      {/* Edit Mode Modal */}
      <Modal visible={showModeModal} animationType="fade" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { height: 'auto', paddingBottom: 40 }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Adjust {editingMode?.label}</Text>
              <TouchableOpacity onPress={() => setShowModeModal(false)}>
                <Text style={{ color: theme.colors.textMuted }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={s.modalBody}>
              <Text style={s.label}>Pattern Name</Text>
              <TextInput 
                style={s.input} 
                placeholder="e.g. Last NEET Mock" 
                placeholderTextColor={theme.colors.textMuted}
                value={editingMode?.label}
                onChangeText={(t) => setEditingMode({ ...editingMode, label: t })}
              />

              <Text style={s.label}>Time Duration (Minutes)</Text>
              <TextInput 
                style={s.input} 
                keyboardType="numeric"
                placeholder="e.g. 180" 
                placeholderTextColor={theme.colors.textMuted}
                value={editingMode?.duration?.toString()}
                onChangeText={(t) => setEditingMode({ ...editingMode, duration: parseInt(t) || 0 })}
              />

              <View style={{ marginTop: 10 }}>
                <Text style={s.subLabel}>Section Distribution</Text>
              </View>

              {editingMode?.sections.map((sec, idx) => (
                <View key={idx} style={{ marginBottom: 16 }}>
                  <Text style={s.label}>{sec.name} Questions</Text>
                  <TextInput 
                    style={s.input} 
                    keyboardType="numeric"
                    value={sec.count.toString()}
                    onChangeText={(v) => handleModeSectionChange(idx, v)}
                  />
                </View>
              ))}

              <View style={s.totalPreview}>
                <Text style={s.totalLabel}>Total Questions:</Text>
                <Text style={s.totalVal}>
                  {editingMode?.sections.reduce((acc, s) => acc + (parseInt(s.count) || 0), 0)}
                </Text>
              </View>

              <TouchableOpacity style={s.submitBtn} onPress={handleUpdateMode}>
                <Text style={s.submitBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  fullLoadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  
  tabBar: { flexDirection: 'row', paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  activeTabText: { color: theme.colors.primary, fontWeight: 'bold' },
  
  modeCard: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  modeTitle: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', flex: 1 },
  totalBadge: { backgroundColor: 'rgba(99, 91, 255, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  totalText: { color: theme.colors.primary, fontSize: 12, fontWeight: '800' },
  modeDistribution: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, gap: 8, marginBottom: 16 },
  distItem: { flexDirection: 'row', alignItems: 'center' },
  distName: { color: theme.colors.textMuted, fontSize: 13 },
  distLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 8, borderStyle: 'dashed' },
  distCount: { color: theme.colors.text, fontSize: 13, fontWeight: 'bold' },
  modeEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 8 },
  modeEditText: { color: theme.colors.primary, fontSize: 12, fontWeight: 'bold' },
  modeDeleteBtn: { backgroundColor: `${theme.colors.error}15`, padding: 6, borderRadius: 8 },
  
  totalPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(99, 91, 255, 0.05)', padding: 16, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: 'rgba(99, 91, 255, 0.1)' },
  totalLabel: { color: theme.colors.textMuted, fontWeight: '600' },
  totalVal: { color: theme.colors.primary, fontSize: 18, fontWeight: 'bold' },
  
  modeCardAdd: { borderStyle: 'dashed', borderWidth: 2, borderColor: `${theme.colors.primary}40`, alignItems: 'center', justifyContent: 'center', paddingVertical: 30, backgroundColor: 'transparent' },
  modeAddText: { color: theme.colors.primary, fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  modeAddSub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4 }
});

export default AdminSubjectManage;
