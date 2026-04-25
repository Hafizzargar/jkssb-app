import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Image, Modal, TextInput, Platform } from 'react-native';
import { CheckCircle, XCircle, ChevronLeft, Newspaper, Sparkles, Plus, Send, Edit2, Trash2, Clock } from 'lucide-react-native';
import api from '../../utils/api';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';
import ConfirmModal from '../../components/ConfirmModal';

const AdminBlogReview = ({ navigation }) => {
  const theme = useTheme();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'published'
  const [publishedCount, setPublishedCount] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [manualBlog, setManualBlog] = useState({ title: '', content: '', category: 'J&K', image: '' });
  
  // Custom Confirmation Modal State
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'pending' ? '/api/admin/blog/pending' : '/api/admin/blog/published';
      const [dataRes, pubRes] = await Promise.all([
        api.get(endpoint),
        api.get('/api/blogs')
      ]);
      setBlogs(Array.isArray(dataRes.data) ? dataRes.data : []);
      setPublishedCount(pubRes.data.length);
    } catch (error) {
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/api/admin/blog/approve/${id}`);
      setBlogs(prev => prev.filter(b => b._id !== id));
      setPublishedCount(prev => prev + 1);
      Alert.alert('Success', 'Blog published to students!');
    } catch (error) {
      Alert.alert('Error', 'Failed to publish blog');
    }
  };

  const handleDelete = (id) => {
    setBlogToDelete(id);
    setConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (!blogToDelete) return;
    try {
      await api.delete(`/api/admin/blog/${blogToDelete}`);
      setBlogs(prev => prev.filter(b => b._id !== blogToDelete));
      if (activeTab === 'published') setPublishedCount(prev => prev - 1);
      Alert.alert('Deleted', 'Blog has been removed.');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete: ' + (error.response?.data?.message || error.message));
    } finally {
      setConfirmVisible(false);
      setBlogToDelete(null);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await api.post('/api/admin/blog/generate');
      fetchPending();
      Alert.alert('Success', 'AI has generated fresh news for review!');
    } catch (error) {
      Alert.alert('Error', 'AI generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRefineTitle = async (id, currentTitle, content) => {
    try {
      setLoading(true);
      const res = await api.post('/api/admin/blog/refine-title', { title: currentTitle, content });
      setBlogs(blogs.map(b => b._id === id ? { ...b, title: res.data.title } : b));
    } catch (error) {
      console.error('Refine Title Error:', error);
      Alert.alert('Error', 'Failed to suggest title');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBlog = async () => {
    const blogData = editingBlog || manualBlog;
    if (!blogData.title || !blogData.content) return Alert.alert('Error', 'Please fill all fields');
    
    try {
      setLoading(true);
      if (editingBlog) {
        await api.put(`/api/admin/blog/${editingBlog._id}`, editingBlog);
        Alert.alert('Success', 'Blog updated!');
      } else {
        await api.post('/api/admin/blog/manual', manualBlog);
        Alert.alert('Success', 'Manual blog posted!');
      }
      setShowManual(false);
      setEditingBlog(null);
      setManualBlog({ title: '', content: '', category: 'J&K', image: '' });
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save blog');
    } finally {
      setLoading(false);
    }
  };

  const getTimeLeft = (expiry) => {
    if (!expiry) return 'No expiry';
    const left = new Date(expiry) - new Date();
    if (left <= 0) return 'Expired';
    const hours = Math.floor(left / (1000 * 60 * 60));
    const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m left`;
  };

  const s = styles(theme);


  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Daily News Control</Text>
          <Text style={s.headerSub}>{publishedCount} blogs active now</Text>
        </View>
        <TouchableOpacity style={s.genHeaderBtn} onPress={() => { setEditingBlog(null); setShowManual(true); }}>
          <Plus color="#000" size={16} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.genHeaderBtn, { marginLeft: 8 }]} onPress={handleGenerate}>
          <Text style={s.genHeaderText}>Gemini AI</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabBar}>
        <TouchableOpacity 
          style={[s.tab, activeTab === 'pending' && s.activeTab]} 
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[s.tabText, activeTab === 'pending' && s.activeTabText]}>Pending Review</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.tab, activeTab === 'published' && s.activeTab]} 
          onPress={() => setActiveTab('published')}
        >
          <Text style={[s.tabText, activeTab === 'published' && s.activeTabText]}>Manage Live</Text>
        </TouchableOpacity>
      </View>

      {/* Manual Post Modal */}
      <Modal visible={showManual} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingBlog ? 'Edit Blog' : 'Manual Blog Post'}</Text>
              <TouchableOpacity onPress={() => { setShowManual(false); setEditingBlog(null); }}>
                <XCircle color={theme.colors.textMuted} size={24} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={s.modalBody}>
              <Text style={s.label}>Title</Text>
              <TextInput 
                style={s.input} 
                value={editingBlog ? editingBlog.title : manualBlog.title} 
                onChangeText={(t) => editingBlog ? setEditingBlog({...editingBlog, title: t}) : setManualBlog({...manualBlog, title: t})}
                placeholder="Enter catchy title..."
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={s.label}>Category</Text>
              <View style={s.categoryRow}>
                {['J&K', 'INDIA', 'WORLD'].map(cat => (
                  <TouchableOpacity 
                    key={cat}
                    style={[s.catChip, (editingBlog ? editingBlog.category : manualBlog.category) === cat && s.catChipActive]}
                    onPress={() => editingBlog ? setEditingBlog({...editingBlog, category: cat}) : setManualBlog({...manualBlog, category: cat})}
                  >
                    <Text style={[s.catChipText, (editingBlog ? editingBlog.category : manualBlog.category) === cat && s.catChipActiveText]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Image URL (Optional)</Text>
              <TextInput 
                style={s.input} 
                value={editingBlog ? editingBlog.image : manualBlog.image} 
                onChangeText={(t) => editingBlog ? setEditingBlog({...editingBlog, image: t}) : setManualBlog({...manualBlog, image: t})}
                placeholder="https://..."
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={s.label}>Content</Text>
              <TextInput 
                style={[s.input, s.textArea]} 
                value={editingBlog ? editingBlog.content : manualBlog.content} 
                onChangeText={(t) => editingBlog ? setEditingBlog({...editingBlog, content: t}) : setManualBlog({...manualBlog, content: t})}
                multiline
                numberOfLines={6}
                placeholder="Write news content..."
                placeholderTextColor={theme.colors.textMuted}
              />

              <TouchableOpacity style={s.submitBtn} onPress={handleSaveBlog}>
                <Send color="#fff" size={18} />
                <Text style={s.submitBtnText}>{editingBlog ? 'Update Blog' : 'Post Now (Exp 11:59 AM)'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {blogs.length === 0 ? (
          <View style={s.emptyState}>
            <Newspaper color={theme.colors.textMuted} size={48} />
            <Text style={s.emptyText}>No pending blogs for review</Text>
            <TouchableOpacity style={s.generateBtn} onPress={handleGenerate}>
              <Text style={s.generateBtnText}>Ask AI to Generate News</Text>
            </TouchableOpacity>
          </View>
        ) : (
          blogs.map((blog) => (
            <View key={blog._id} style={s.card}>
              {blog.image && (
                <Image source={{ uri: blog.image }} style={s.cardImage} resizeMode="cover" />
              )}
              <View style={s.cardBody}>
                <View style={s.cardHeader}>
                  <View style={s.categoryBadge}>
                    <Text style={s.categoryText}>{blog.category}</Text>
                  </View>
                  <View style={s.expiryBadge}>
                    <Clock color={theme.colors.primary} size={10} />
                    <Text style={s.expiryText}>{getTimeLeft(blog.expiresAt)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={[s.cardTitle, { flex: 1, marginBottom: 0 }]}>{blog.title}</Text>
                  {activeTab === 'pending' && (
                    <TouchableOpacity 
                      style={s.refineBtn}
                      onPress={() => handleRefineTitle(blog._id, blog.title, blog.content)}
                    >
                      <Sparkles color={theme.colors.primary} size={16} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={s.cardExcerpt} numberOfLines={3}>{blog.content}</Text>
                
                <View style={s.actions}>
                  {activeTab === 'pending' ? (
                    <>
                      <TouchableOpacity 
                        style={[s.actionBtn, s.approveBtn]}
                        onPress={() => handleApprove(blog._id)}
                      >
                        <CheckCircle color="#fff" size={18} />
                        <Text style={s.actionText}>Approve & Publish</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[s.actionBtn, s.rejectBtn]}
                        onPress={() => handleDelete(blog._id)}
                      >
                        <Trash2 color={theme.colors.error} size={18} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity 
                        style={[s.actionBtn, s.editBtn]}
                        onPress={() => { setEditingBlog(blog); setShowManual(true); }}
                      >
                        <Edit2 color="#fff" size={18} />
                        <Text style={s.actionText}>Edit Content</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[s.actionBtn, s.rejectBtn]}
                        onPress={() => handleDelete(blog._id)}
                      >
                        <Trash2 color={theme.colors.error} size={18} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ConfirmModal 
        visible={confirmVisible}
        title="Delete Blog"
        message="Are you sure you want to permanently delete this news item? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmVisible(false)}
        confirmText="Yes, Delete"
        cancelText="Keep Blog"
      />

      {loading && (
        <View style={s.loadingOverlay}>
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={s.loadingText}>Processing...</Text>
            <Text style={s.loadingSubText}>♊ Gemini is researching latest news or refining content...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  backBtn: { marginRight: 12 },
  headerTitle: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: theme.colors.primary, fontSize: 11, fontWeight: '600' },
  content: { flex: 1, padding: spacing.lg },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: theme.colors.textMuted, marginTop: 12, fontSize: 16 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden'
  },
  cardImage: { width: '100%', height: 160 },
  cardBody: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  categoryBadge: { 
    backgroundColor: `${theme.colors.primary}20`, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  categoryText: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold' },
  dateText: { color: theme.colors.textMuted, fontSize: 10 },
  cardTitle: { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  cardExcerpt: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 10, 
    borderRadius: 10,
    gap: 8
  },
  approveBtn: { backgroundColor: theme.colors.success, flex: 1 },
  editBtn: { backgroundColor: theme.colors.primary, flex: 1 },
  rejectBtn: { backgroundColor: `${theme.colors.error}20`, width: 44 },
  actionText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  activeTabText: { color: theme.colors.primary, fontWeight: 'bold' },
  expiryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${theme.colors.primary}10`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  expiryText: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold' },
  generateBtn: {
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  generateBtnText: { color: theme.colors.primary, fontWeight: 'bold' },
  genHeaderBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  genHeaderText: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  refineBtn: {
    padding: 8,
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 10,
    marginLeft: 8
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: theme.colors.background, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    height: '85%', 
    padding: 20 
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', gap: 8 },
  catChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: theme.colors.border 
  },
  catChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  catChipText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: 'bold' },
  catChipActiveText: { color: '#000' },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    marginTop: 24,
    gap: 8,
    marginBottom: 40
  },
  submitBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingCard: {
    backgroundColor: theme.colors.surface,
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: '80%'
  },
  loadingText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15
  },
  loadingSubText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8
  }
});

export default AdminBlogReview;
