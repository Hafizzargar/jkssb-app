import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, StatusBar, Alert } from 'react-native';
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
      setUsers(users.map(u => u._id === userId ? { ...u, status: 'APPROVED' } : u));
    } catch (error) {
      // Handled by interceptor
    } finally {
      setProcessingId(null);
    }
  };

  const handleDisable = async (userId) => {
    setProcessingId(userId);
    try {
      await client.delete(`/auth/disable-user/${userId}`);
      toast('User disabled successfully', 'info');
      setUsers(users.map(u => u._id === userId ? { ...u, status: 'DISABLED' } : u));
    } catch (error) {
      // Handled by interceptor
    } finally {
      setProcessingId(null);
    }
  };

  const s = styles(theme);

  const renderUser = ({ item }) => (
    <View style={s.userCard}>
      <View style={s.userInfo}>
        <View style={s.userHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{item.name}</Text>
            <Text style={s.userHandle}>@{item.username}</Text>
          </View>
          <View style={[
            s.statusBadge, 
            item.status === 'APPROVED' ? s.statusApproved : 
            item.status === 'DISABLED' ? s.statusDisabled : s.statusPending
          ]}>
            <Text style={[
              s.statusText, 
              item.status === 'APPROVED' ? s.textApproved : 
              item.status === 'DISABLED' ? s.textDisabled : s.textPending
            ]}>
              {item.status || 'PENDING'}
            </Text>
          </View>
        </View>
        
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
        {item.status !== 'APPROVED' && (
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
                <Text style={s.approveText}>{item.status === 'DISABLED' ? 'Enable' : 'Approve'}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {item.status !== 'DISABLED' && (
          <TouchableOpacity 
            style={[s.actionButton, s.disableButton]} 
            onPress={() => {
              Alert.alert(
                'Disable User',
                'Are you sure you want to disable this user? They will not be able to login.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Disable', style: 'destructive', onPress: () => handleDisable(item._id) }
                ]
              );
            }}
            disabled={processingId === item._id}
          >
            <UserX color={theme.colors.error} size={18} />
            <Text style={s.disableText}>Disable</Text>
          </TouchableOpacity>
        )}
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
        <Text style={s.title}>User Management</Text>
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
              <Text style={s.emptyText}>No registered users found</Text>
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
  userHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  userHandle: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  statusPending: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: '#fbbf24',
  },
  statusDisabled: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: theme.colors.error,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textApproved: {
    color: '#10b981',
  },
  textPending: {
    color: '#fbbf24',
  },
  textDisabled: {
    color: theme.colors.error,
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
  disableButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  disableText: {
    color: theme.colors.error,
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
