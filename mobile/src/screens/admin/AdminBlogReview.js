import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Alert, Image, Modal, TextInput
} from 'react-native';
import {
  CheckCircle, XCircle, ChevronLeft, Newspaper, Sparkles,
  Plus, Send, Edit2, Trash2, Clock, Zap
} from 'lucide-react-native';
import api from '../../utils/api';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';
import ConfirmModal from '../../components/ConfirmModal';

const EXAM_SUBJECTS = ['JKSSB', 'NEET', 'JEE', 'UPSC', 'BANKING', 'GENERAL'];

const AdminBlogReview = ({ navigation }) => {
  const theme = useTheme();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [publishedCount, setPublishedCount] = useState(0);

  // Manual / Edit modal
  const [showManual, setShowManual] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [manualBlog, setManualBlog] = useState({ title: '', content: '', category: 'JKSSB', image: '' });

  // AI subject picker modal
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('JKSSB');

  // Delete confirm modal
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'pending' ? '/admin/blog/pending' : '/admin/blog/published';
      const [dataRes, pubRes] = await Promise.all([
        api.get(endpoint),
        api.get('/blogs'),
      ]);
      setBlogs(Array.isArray(dataRes.data) ? dataRes.data : []);
      setPublishedCount(pubRes.data.length);
    } catch {
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setLoading(true);
      await api.patch(`/admin/blog/approve/${id}`);
      setBlogs(prev => prev.filter(b => b._id !== id));
      setPublishedCount(prev => prev + 1);
      Alert.alert('Published!', 'Blog is now live for students.');
    } catch {
      Alert.alert('Error', 'Failed to publish blog');
    } finally { setLoading(false); }
  };

  const handleDelete = (id) => { setBlogToDelete(id); setConfirmVisible(true); };

  const confirmDelete = async () => {
    if (!blogToDelete) return;
    try {
      setLoading(true);
      await api.delete(`/admin/blog/${blogToDelete}`);
      setBlogs(prev => prev.filter(b => b._id !== blogToDelete));
      if (activeTab === 'published') setPublishedCount(prev => prev - 1);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || e.message);
    } finally {
      setConfirmVisible(false);
      setBlogToDelete(null);
      setLoading(false);
    }
  };

  // Step 1: Open subject picker → Step 2: generate with chosen subject
  const handleGeneratePress = () => setShowSubjectPicker(true);

  const runGenerate = async (subject) => {
    setShowSubjectPicker(false);
    setLoading(true);
    try {
      await api.post('/admin/blog/generate', { subject });
      await fetchData();
      Alert.alert('Done!', `Generated fresh ${subject} news for review.`);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'AI generation failed');
    } finally { setLoading(false); }
  };

  const handleRefineTitle = async (id, currentTitle, content) => {
    try {
      setLoading(true);
      const res = await api.post('/admin/blog/refine-title', { title: currentTitle, content });
      setBlogs(blogs.map(b => b._id === id ? { ...b, title: res.data.title } : b));
    } catch {
      Alert.alert('Error', 'Failed to refine title');
    } finally { setLoading(false); }
  };

  const handleSaveBlog = async () => {
    const blogData = editingBlog || manualBlog;
    if (!blogData.title || !blogData.content) return Alert.alert('Error', 'Please fill title and content');
    try {
      setLoading(true);
      if (editingBlog) {
        await api.put(`/admin/blog/${editingBlog._id}`, editingBlog);
        Alert.alert('Updated!', 'Blog updated successfully.');
      } else {
        await api.post('/admin/blog/manual', manualBlog);
        Alert.alert('Posted!', 'Manual blog is pending review.');
      }
      setShowManual(false);
      setEditingBlog(null);
      setManualBlog({ title: '', content: '', category: 'JKSSB', image: '' });
      fetchData();
    } catch {
      Alert.alert('Error', 'Failed to save blog');
    } finally { setLoading(false); }
  };

  const getTimeLeft = (expiry) => {
    if (!expiry) return 'No expiry';
    const left = new Date(expiry) - new Date();
    if (left <= 0) return 'Expired';
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    return `${h}h ${m}m left`;
  };

  const getCategoryColor = (cat) => {
    const map = {
      JKSSB: '#6366f1', NEET: '#10b981', JEE: '#f59e0b',
      UPSC: '#3b82f6', BANKING: '#8b5cf6', GENERAL: '#64748b',
      'J&K': '#6366f1', INDIA: '#f97316', WORLD: '#06b6d4', OFFICIAL: '#ef4444'
    };
    return map[cat] || '#64748b';
  };

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container}>
      {/* ─── Header ─── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Daily News Control</Text>
          <Text style={s.headerSub}>{publishedCount} blogs active now</Text>
        </View>

        {/* Manual Post */}
        <TouchableOpacity style={s.headerBtn} onPress={() => { setEditingBlog(null); setShowManual(true); }}>
          <Plus color="#000" size={18} />
        </TouchableOpacity>

        {/* AI Generate */}
        <TouchableOpacity style={[s.headerBtn, s.geminiBtn]} onPress={handleGeneratePress}>
          <Zap color="#000" size={14} />
          <Text style={s.geminiText}>Gemini AI</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Tabs ─── */}
      <View style={s.tabBar}>
        {['pending', 'published'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.activeTabText]}>
              {tab === 'pending' ? 'Pending Review' : 'Manage Live'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Subject Picker Modal ─── */}
      <Modal visible={showSubjectPicker} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>AI News Research</Text>
                <Text style={s.modalSub}>Select exam — AI generates 3 targeted news posts</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSubjectPicker(false)}>
                <XCircle color={theme.colors.textMuted} size={24} />
              </TouchableOpacity>
            </View>
            <View style={s.subjectGrid}>
              {EXAM_SUBJECTS.map(subj => (
                <TouchableOpacity
                  key={subj}
                  style={[
                    s.subjectChip,
                    { borderColor: getCategoryColor(subj) },
                    selectedSubject === subj && { backgroundColor: getCategoryColor(subj) }
                  ]}
                  onPress={() => setSelectedSubject(subj)}
                >
                  <Text style={[
                    s.subjectChipText,
                    { color: selectedSubject === subj ? '#000' : getCategoryColor(subj) }
                  ]}>{subj}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[s.generateBtn, { backgroundColor: getCategoryColor(selectedSubject) }]} onPress={() => runGenerate(selectedSubject)}>
              <Zap color="#000" size={18} />
              <Text style={s.generateBtnText}>Generate {selectedSubject} News</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Manual Post Modal ─── */}
      <Modal visible={showManual} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingBlog ? 'Edit Blog' : 'Manual Blog Post'}</Text>
              <TouchableOpacity onPress={() => { setShowManual(false); setEditingBlog(null); }}>
                <XCircle color={theme.colors.textMuted} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>

              <Text style={s.label}>Category / Exam</Text>
              <View style={s.subjectGrid}>
                {EXAM_SUBJECTS.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      s.subjectChip,
                      { borderColor: getCategoryColor(cat) },
                      (editingBlog ? editingBlog.category : manualBlog.category) === cat && { backgroundColor: getCategoryColor(cat) }
                    ]}
                    onPress={() =>
                      editingBlog
                        ? setEditingBlog({ ...editingBlog, category: cat })
                        : setManualBlog({ ...manualBlog, category: cat })
                    }
                  >
                    <Text style={[
                      s.subjectChipText,
                      { color: (editingBlog ? editingBlog.category : manualBlog.category) === cat ? '#000' : getCategoryColor(cat) }
                    ]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Title</Text>
              <TextInput
                style={s.input}
                value={editingBlog ? editingBlog.title : manualBlog.title}
                onChangeText={t => editingBlog ? setEditingBlog({ ...editingBlog, title: t }) : setManualBlog({ ...manualBlog, title: t })}
                placeholder="Enter catchy title..."
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={s.label}>Image URL (Optional)</Text>
              <TextInput
                style={s.input}
                value={editingBlog ? editingBlog.image : manualBlog.image}
                onChangeText={t => editingBlog ? setEditingBlog({ ...editingBlog, image: t }) : setManualBlog({ ...manualBlog, image: t })}
                placeholder="https://..."
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={s.label}>Content</Text>
              <TextInput
                style={[s.input, s.textArea]}
                value={editingBlog ? editingBlog.content : manualBlog.content}
                onChangeText={t => editingBlog ? setEditingBlog({ ...editingBlog, content: t }) : setManualBlog({ ...manualBlog, content: t })}
                multiline
                numberOfLines={6}
                placeholder="Write news content..."
                placeholderTextColor={theme.colors.textMuted}
              />

              <TouchableOpacity style={s.submitBtn} onPress={handleSaveBlog}>
                <Send color="#fff" size={18} />
                <Text style={s.submitBtnText}>{editingBlog ? 'Update Blog' : 'Post for Review'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Blog List ─── */}
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {blogs.length === 0 ? (
          <View style={s.emptyState}>
            <Newspaper color={theme.colors.textMuted} size={48} />
            <Text style={s.emptyText}>No blogs here yet</Text>
            <TouchableOpacity style={[s.generateBtn, { backgroundColor: theme.colors.primary, marginTop: 20 }]} onPress={handleGeneratePress}>
              <Zap color="#000" size={16} />
              <Text style={s.generateBtnText}>Ask Gemini AI</Text>
            </TouchableOpacity>
          </View>
        ) : (
          blogs.map(blog => (
            <View key={blog._id} style={s.card}>
              <Image
                source={{ uri: blog.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000' }}
                style={s.cardImage}
                resizeMode="cover"
              />
              {/* Category Badge over image */}
              <View style={[s.catOverlay, { backgroundColor: getCategoryColor(blog.category) }]}>
                <Text style={s.catOverlayText}>{blog.category}</Text>
              </View>

              <View style={s.cardBody}>
                <View style={s.cardMeta}>
                  <View style={s.expiryBadge}>
                    <Clock color={theme.colors.primary} size={10} />
                    <Text style={s.expiryText}>{getTimeLeft(blog.expiresAt)}</Text>
                  </View>
                  {blog.isAI && (
                    <View style={s.aiBadge}>
                      <Zap color="#f59e0b" size={10} />
                      <Text style={s.aiText}>Gemini AI</Text>
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={[s.cardTitle, { flex: 1 }]}>{blog.title}</Text>
                  {activeTab === 'pending' && (
                    <TouchableOpacity style={s.refineBtn} onPress={() => handleRefineTitle(blog._id, blog.title, blog.content)}>
                      <Sparkles color={theme.colors.primary} size={16} />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={s.cardExcerpt} numberOfLines={3}>{blog.content}</Text>

                <View style={s.actions}>
                  {activeTab === 'pending' ? (
                    <>
                      <TouchableOpacity style={[s.actionBtn, s.approveBtn]} onPress={() => handleApprove(blog._id)}>
                        <CheckCircle color="#000" size={16} />
                        <Text style={s.actionText}>Approve & Publish</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.actionBtn, s.rejectBtn]} onPress={() => handleDelete(blog._id)}>
                        <Trash2 color={theme.colors.error} size={16} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity style={[s.actionBtn, s.editBtn]} onPress={() => { setEditingBlog(blog); setShowManual(true); }}>
                        <Edit2 color="#000" size={16} />
                        <Text style={s.actionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.actionBtn, s.rejectBtn]} onPress={() => handleDelete(blog._id)}>
                        <Trash2 color={theme.colors.error} size={16} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmModal
        visible={confirmVisible}
        title="Delete Blog"
        message="Permanently delete this news item?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmVisible(false)}
        confirmText="Delete"
        cancelText="Keep"
      />

      {loading && (
        <View style={s.loadingOverlay}>
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={s.loadingText}>Processing...</Text>
            <Text style={s.loadingSubText}>♊ Gemini is generating unique news content...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { marginRight: 12 },
  headerTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: theme.colors.primary, fontSize: 11, fontWeight: '600' },
  headerBtn: { backgroundColor: theme.colors.primary, padding: 8, borderRadius: 8, marginLeft: 8 },
  geminiBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 },
  geminiText: { color: '#000', fontSize: 12, fontWeight: 'bold' },

  tabBar: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  activeTabText: { color: theme.colors.primary, fontWeight: 'bold' },

  content: { flex: 1, padding: spacing.lg },

  // Subject picker & manual modal shared
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
  modalSub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 4 },
  modalBody: { flex: 0 },

  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  subjectChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 2 },
  subjectChipText: { fontSize: 13, fontWeight: 'bold' },

  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, gap: 8 },
  generateBtnText: { color: '#000', fontWeight: 'bold', fontSize: 15 },

  label: { color: theme.colors.text, fontSize: 14, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 14, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
  textArea: { height: 130, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, marginTop: 20, gap: 8, marginBottom: 40 },
  submitBtnText: { color: '#000', fontWeight: 'bold', fontSize: 15 },

  // Cards
  card: { backgroundColor: theme.colors.surface, borderRadius: borderRadius.lg, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  cardImage: { width: '100%', height: 170 },
  catOverlay: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  catOverlayText: { color: '#000', fontSize: 11, fontWeight: 'bold' },
  cardBody: { padding: 16 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  expiryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${theme.colors.primary}15`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  expiryText: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f59e0b20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  aiText: { color: '#f59e0b', fontSize: 10, fontWeight: 'bold' },
  cardTitle: { color: theme.colors.text, fontSize: 15, fontWeight: 'bold', lineHeight: 22 },
  cardExcerpt: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  refineBtn: { padding: 8, backgroundColor: `${theme.colors.primary}15`, borderRadius: 10, marginLeft: 8 },

  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  approveBtn: { backgroundColor: theme.colors.success, flex: 1 },
  editBtn: { backgroundColor: theme.colors.primary, flex: 1 },
  rejectBtn: { backgroundColor: `${theme.colors.error}15`, width: 44 },
  actionText: { color: '#000', fontWeight: 'bold', fontSize: 13 },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: theme.colors.textMuted, marginTop: 12, fontSize: 16 },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' },
  loadingCard: { backgroundColor: theme.colors.surface, padding: 30, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, width: '80%' },
  loadingText: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 15 },
  loadingSubText: { color: theme.colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});

export default AdminBlogReview;
