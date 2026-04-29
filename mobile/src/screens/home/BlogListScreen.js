import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, FlatList, Image, Alert } from 'react-native';
import { ChevronLeft, Newspaper, Calendar, ArrowRight, Clock } from 'lucide-react-native';
import api from '../../utils/api';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';

const BlogListScreen = ({ navigation }) => {
  const theme = useTheme();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await api.get('/blogs');
      setBlogs(res.data);
    } catch (error) {
      console.error('Fetch blogs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeLeft = (expiry) => {
    if (!expiry) return null;
    const left = new Date(expiry) - new Date();
    if (left <= 0) return 'Expired';
    const hours = Math.floor(left / (1000 * 60 * 60));
    const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m left`;
  };

  const s = styles(theme);

  const renderBlogItem = ({ item }) => (
    <View style={s.card}>
      {item.image && (
        <Image source={{ uri: item.image }} style={s.cardImage} resizeMode="cover" />
      )}
      <View style={s.cardBody}>
        <View style={s.cardHeader}>
          <View style={s.categoryBadge}>
            <Text style={s.categoryText}>{item.category}</Text>
          </View>
          <View style={s.expiryBadge}>
            <Clock color={theme.colors.primary} size={10} />
            <Text style={s.expiryText}>{getTimeLeft(item.expiresAt)}</Text>
          </View>
        </View>
        
        <Text style={s.title}>{item.title}</Text>
        <Text style={s.content} numberOfLines={4}>{item.content}</Text>
        
        <TouchableOpacity style={s.readMore} onPress={() => navigation.navigate('BlogDetail', { blog: item })}>
          <Text style={s.readMoreText}>Read Full Article</Text>
          <ArrowRight color={theme.colors.primary} size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return (
    <View style={[s.container, { justifyContent: 'center' }]}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Daily News Update</Text>
      </View>

      <FlatList
        data={blogs}
        keyExtractor={(item) => item._id}
        renderItem={renderBlogItem}
        contentContainerStyle={s.listContent}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Newspaper color={theme.colors.textMuted} size={64} />
            <Text style={s.emptyText}>No news articles today</Text>
            <Text style={s.emptySub}>Check back later for fresh updates!</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
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
  listContent: { padding: spacing.lg },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden'
  },
  cardImage: { width: '100%', height: 180 },
  cardBody: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  categoryBadge: { 
    backgroundColor: `${theme.colors.primary}20`, 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8 
  },
  categoryText: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold' },
  expiryBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${theme.colors.primary}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  expiryText: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold' },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12, lineHeight: 24 },
  content: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 22, marginBottom: 20 },
  readMore: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16
  },
  readMoreText: { color: theme.colors.primary, fontSize: 14, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySub: { color: theme.colors.textMuted, fontSize: 14, marginTop: 8 },
});

export default BlogListScreen;
