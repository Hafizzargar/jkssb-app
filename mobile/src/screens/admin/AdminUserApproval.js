import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, StatusBar } from 'react-native';
import { UserCheck, UserX, ArrowLeft, Mail, Phone, Calendar } from 'lucide-react-native';
import { useTheme } from '../../utils/useTheme';
import { spacing, borderRadius } from '../../theme';
import client from '../../api/client';
import { toast } from '../../components/Toast';

const AdminUserApproval = ({ navigation }) => {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await client.get('/auth/pending-users');
      setUsers(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    setProcessingId(userId);
    try {
      await client.post('/auth/approve-user', { userId });
      toast('User approved successfully!', 'success');
      setUsers(users.filter(u => u._id !== userId));
    } catch (error) {
      // Interceptor handles error
    } finally {
      setProcessingId(null);
    }
  };

  const s = styles(theme);

  const renderUser = ({ item }) => (
    <View style={s.userCard}>
      <View style={s.userInfo}>
        <Text style={s.userName}>{item.name}</Text>
        <Text style={s.userHandle}>@{item.username}</Text>
        
        <View style={s.detailRow}>
          <Mail color={theme.colors.textMuted} size={14} />
          <Text style={s.detailText}>{item.email}</Text>
        </View>
        
        <View style={s.detailRow}>
          <Phone color={theme.colors.textMuted} size={14} />
          <Text style={s.detailText}>{item.phone}</Text>
        </View>
        
        <View style={s.detailRow}>
          <Calendar color={theme.colors.textMuted} size={14} />
          <Text style={s.detailText}>Joined: {new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={s.actions}>
        <TouchableOpacity 
          style={[s.actionButton, s.approveButton]} 
          onPress={() => handleApprove(item._id)}
          disabled={processingId === item._id}
        >
          {processingId === item._id ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <>
              <UserCheck color="#000" size={18} />
              <Text style={s.approveText}>Approve</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={theme.name === 'Dark Mode' ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backButton}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={s.title}>User Approvals</Text>
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.centered}>
              <UserCheck color={theme.colors.textMuted} size={64} opacity={0.2} />
              <Text style={s.emptyText}>No users awaiting approval</Text>
            </View>
          }
        />
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
    gap: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  userInfo: {
    marginBottom: spacing.lg,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: borderRadius.md,
    gap: 8,
  },
  approveButton: {
    backgroundColor: theme.colors.primary,
  },
  approveText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    marginTop: 16,
  },
});

export default AdminUserApproval;
