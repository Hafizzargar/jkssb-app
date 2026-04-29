import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Animated, Share, Dimensions
} from 'react-native';
import { ChevronLeft, Clock, Share2, Zap, BookOpen } from 'lucide-react-native';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 260;

const getCategoryColor = (cat) => {
  const map = {
    JKSSB: '#6366f1', NEET: '#10b981', JEE: '#f59e0b',
    UPSC: '#3b82f6', BANKING: '#8b5cf6', GENERAL: '#64748b',
    'J&K': '#6366f1', INDIA: '#f97316', WORLD: '#06b6d4', OFFICIAL: '#ef4444'
  };
  return map[cat] || '#6366f1';
};

const getTimeLeft = (expiry) => {
  if (!expiry) return null;
  const left = new Date(expiry) - new Date();
  if (left <= 0) return 'Expired';
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  return `${h}h ${m}m left`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

const BlogDetailScreen = ({ route, navigation }) => {
  const { blog } = route.params;
  const theme = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const catColor = getCategoryColor(blog.category);

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const headerOpacity = scrollY.interpolate({
    inputRange: [IMAGE_HEIGHT - 80, IMAGE_HEIGHT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.3, 1],
    extrapolate: 'clamp',
  });

  const handleShare = async () => {
    try {
      await Share.share({
        title: blog.title,
        message: `${blog.title}\n\n${blog.content.substring(0, 300)}...\n\nRead more on PrepMaster`,
      });
    } catch {}
  };

  const paragraphs = blog.content
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container}>
      {/* Sticky header (appears on scroll) */}
      <Animated.View style={[s.stickyHeader, { opacity: headerOpacity }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.stickyBack}>
          <ChevronLeft color={theme.colors.text} size={22} />
        </TouchableOpacity>
        <Text style={s.stickyTitle} numberOfLines={1}>{blog.title}</Text>
        <TouchableOpacity onPress={handleShare} style={s.stickyBack}>
          <Share2 color={theme.colors.text} size={20} />
        </TouchableOpacity>
      </Animated.View>

      {/* Floating back button (always visible at top) */}
      <View style={s.floatingButtons}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.floatBtn}>
          <ChevronLeft color="#fff" size={22} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={s.floatBtn}>
          <Share2 color="#fff" size={18} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <Animated.Image
          source={{
            uri: blog.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000'
          }}
          style={[s.heroImage, { transform: [{ scale: imageScale }] }]}
          resizeMode="cover"
        />

        {/* Gradient overlay fade at bottom of image */}
        <View style={s.imageGradient} />

        {/* Content Card */}
        <Animated.View style={[s.contentCard, { opacity: fadeIn }]}>

          {/* Category + Badges */}
          <View style={s.badgeRow}>
            <View style={[s.catBadge, { backgroundColor: `${catColor}20`, borderColor: catColor }]}>
              <Text style={[s.catBadgeText, { color: catColor }]}>{blog.category}</Text>
            </View>
            {blog.isAI && (
              <View style={s.aiBadge}>
                <Zap color="#f59e0b" size={11} />
                <Text style={s.aiText}>AI Generated</Text>
              </View>
            )}
            {getTimeLeft(blog.expiresAt) && (
              <View style={s.timeBadge}>
                <Clock color={theme.colors.textMuted} size={11} />
                <Text style={s.timeText}>{getTimeLeft(blog.expiresAt)}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={s.title}>{blog.title}</Text>

          {/* Meta */}
          <View style={s.metaRow}>
            <BookOpen color={theme.colors.textMuted} size={13} />
            <Text style={s.metaText}>
              {blog.author || 'PrepMaster'}  ·  {formatDate(blog.createdAt)}
            </Text>
          </View>

          <View style={s.divider} />

          {/* Article Body — split into paragraphs */}
          {paragraphs.map((para, idx) => (
            <Text key={idx} style={s.paragraph}>{para}</Text>
          ))}

          {/* Share CTA */}
          <TouchableOpacity style={[s.shareBtn, { backgroundColor: `${catColor}15`, borderColor: catColor }]} onPress={handleShare}>
            <Share2 color={catColor} size={16} />
            <Text style={[s.shareBtnText, { color: catColor }]}>Share this article</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  // Sticky header
  stickyHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    backgroundColor: theme.colors.background,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  stickyBack: { padding: 4 },
  stickyTitle: { flex: 1, color: theme.colors.text, fontWeight: 'bold', fontSize: 14, marginHorizontal: 12 },

  // Floating buttons over image
  floatingButtons: {
    position: 'absolute', top: 16, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, zIndex: 50
  },
  floatBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20, padding: 8,
  },

  heroImage: { width, height: IMAGE_HEIGHT },
  imageGradient: {
    position: 'absolute', top: IMAGE_HEIGHT - 60, left: 0, right: 0, height: 60,
    backgroundColor: theme.colors.background, opacity: 0.9
  },

  contentCard: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    marginTop: -24, padding: 24,
  },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  catBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5 },
  catBadgeText: { fontSize: 11, fontWeight: 'bold' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f59e0b15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  aiText: { color: '#f59e0b', fontSize: 11, fontWeight: 'bold' },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${theme.colors.surface}`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  timeText: { color: theme.colors.textMuted, fontSize: 11 },

  title: { color: theme.colors.text, fontSize: 22, fontWeight: 'bold', lineHeight: 32, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  metaText: { color: theme.colors.textMuted, fontSize: 13 },

  divider: { height: 1, backgroundColor: theme.colors.border, marginBottom: 20 },

  paragraph: {
    color: theme.colors.text, fontSize: 15.5, lineHeight: 27,
    marginBottom: 18, letterSpacing: 0.1
  },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 14, borderWidth: 1.5, marginTop: 10,
  },
  shareBtnText: { fontWeight: 'bold', fontSize: 14 },
});

export default BlogDetailScreen;
