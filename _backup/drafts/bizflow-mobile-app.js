/**
 * BizFlow Mobile App - React Native
 * Works on iOS + Android
 * 
 * Installation:
 * npx react-native init BizFlowMobile
 * npm install @react-navigation/native @react-navigation/bottom-tabs axios async-storage
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  AsyncStorage,
  FlatList,
  Image,
} from 'react-native';
import axios from 'axios';

const API_BASE = 'https://api.bizflow.in/api'; // Your backend URL

// ============================================================
// COLORS
// ============================================================
const Colors = {
  bg: '#0A0E27',
  surface: '#151B3A',
  card: '#1F2859',
  border: '#3D4B7A',
  brand: '#4F46E5',
  brandLight: '#6366F1',
  success: '#10B981',
  error: '#EF4444',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textFaint: '#475569',
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safeArea: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: Colors.brand,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: Colors.text,
    marginBottom: 12,
    fontSize: 14,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stat: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  navLabelActive: {
    color: Colors.brand,
    fontWeight: '600',
  },
});

// ============================================================
// MAIN APP
// ============================================================
export default function BizFlowMobile() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      if (token && user) {
        setAuthState({
          isAuthenticated: true,
          user: JSON.parse(user),
          token,
          loading: false,
        });
      } else {
        setAuthState({ ...authState, loading: false });
      }
    } catch (err) {
      setAuthState({ ...authState, loading: false });
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      setAuthState({
        isAuthenticated: true,
        user: response.data.user,
        token: response.data.token,
        loading: false,
      });
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Check your credentials');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
    });
  };

  if (authState.loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.brand}/>
      </View>
    );
  }

  if (!authState.isAuthenticated) {
    return <AuthScreen onLogin={handleLogin}/>;
  }

  return <MainApp user={authState.user} token={authState.token} onLogout={handleLogout}/>;
}

// ============================================================
// AUTH SCREEN
// ============================================================
function AuthScreen({ onLogin }) {
  const [page, setPage] = useState('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    if (page === 'login') {
      await onLogin(email, password);
    } else {
      // Register flow
      Alert.alert('Coming Soon', 'Registration via mobile coming soon');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, justifyContent: 'center', flexGrow: 1 }}>
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 36, fontWeight: '900', color: Colors.brand, marginBottom: 8 }}>BizFlow</Text>
          <Text style={{ fontSize: 13, color: Colors.textMuted }}>Business Payment Platform</Text>
        </View>

        {/* Form */}
        <View>
          {page === 'login' ? (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textFaint}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textFaint}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ marginTop: 16 }} onPress={() => setPage('register')}>
                <Text style={{ textAlign: 'center', color: Colors.textMuted, fontSize: 13 }}>
                  Don't have an account? <Text style={{ color: Colors.brand, fontWeight: '600' }}>Register</Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Company Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your Company"
                placeholderTextColor={Colors.textFaint}
                value={companyName}
                onChangeText={setCompanyName}
              />

              <Text style={styles.label}>GSTIN</Text>
              <TextInput
                style={styles.input}
                placeholder="15 digit GSTIN"
                placeholderTextColor={Colors.textFaint}
                value={gstin}
                onChangeText={setGstin}
              />

              <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Coming Soon', 'Registration feature coming soon')}>
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ marginTop: 16 }} onPress={() => setPage('login')}>
                <Text style={{ textAlign: 'center', color: Colors.textMuted, fontSize: 13 }}>
                  Already registered? <Text style={{ color: Colors.brand, fontWeight: '600' }}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================
// MAIN APP WITH NAVIGATION
// ============================================================
function MainApp({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({ orders: [], invoices: [], totalOutstanding: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab data={data} loading={loading}/>;
      case 'orders':
        return <OrdersTab data={data}/>;
      case 'invoices':
        return <InvoicesTab data={data}/>;
      case 'profile':
        return <ProfileTab user={user} onLogout={onLogout}/>;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BizFlow</Text>
        <Text style={styles.headerSub}>{user?.role?.toUpperCase()} Portal</Text>
      </View>

      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.navBar}>
        {[
          { key: 'dashboard', label: 'Dashboard', icon: '📊' },
          { key: 'orders', label: 'Orders', icon: '🛒' },
          { key: 'invoices', label: 'Invoices', icon: '🧾' },
          { key: 'profile', label: 'Profile', icon: '👤' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={styles.navItem}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={{ fontSize: 20 }}>{tab.icon}</Text>
            <Text style={[styles.navLabel, activeTab === tab.key && styles.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ============================================================
// TAB SCREENS
// ============================================================
function DashboardTab({ data, loading }) {
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.brand}/>
      </View>
    );
  }

  return (
    <ScrollView style={styles.content}>
      {/* Stats */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { label: 'Outstanding', value: `Rs ${data.totalOutstanding?.toLocaleString('en-IN')}`, icon: '💸' },
          { label: 'Unpaid', value: data.unpaidCount || 0, icon: '📋' },
        ].map((stat, i) => (
          <View key={i} style={[styles.stat, { flex: 0.5 }]}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={{ fontSize: 18, marginTop: 8 }}>{stat.icon}</Text>
          </View>
        ))}
      </View>

      {/* Orders */}
      <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 }}>Recent Orders</Text>
      {(data.orders || []).slice(0, 5).map(order => (
        <View key={order.id} style={styles.card}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text }}>{order.order_number}</Text>
          <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 4 }}>
            Rs {order.total_amount?.toLocaleString('en-IN')} • {order.status}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

function OrdersTab({ data }) {
  return (
    <ScrollView style={styles.content}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 }}>Your Orders</Text>
      {(data.orders || []).map(order => (
        <View key={order.id} style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text }}>{order.order_number}</Text>
              <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 4 }}>
                {new Date(order.created_at).toLocaleDateString('en-IN')}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.text }}>
                Rs {order.total_amount?.toLocaleString('en-IN')}
              </Text>
              <Text style={{ fontSize: 11, color: Colors.success, fontWeight: '600', marginTop: 4 }}>
                {order.status?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function InvoicesTab({ data }) {
  return (
    <ScrollView style={styles.content}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 }}>Your Invoices</Text>
      {(data.invoices || []).map(invoice => (
        <View key={invoice.id} style={styles.card}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text }}>{invoice.invoice_number}</Text>
          <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 4 }}>
            Rs {invoice.amount?.toLocaleString('en-IN')} • {invoice.paid ? 'PAID' : 'PENDING'}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

function ProfileTab({ user, onLogout }) {
  return (
    <ScrollView style={styles.content}>
      <View style={styles.card}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12 }}>Account Info</Text>
        <Text style={{ color: Colors.textMuted, fontSize: 13, marginBottom: 8 }}>Name: {user?.name}</Text>
        <Text style={{ color: Colors.textMuted, fontSize: 13, marginBottom: 8 }}>Email: {user?.email}</Text>
        <Text style={{ color: Colors.textMuted, fontSize: 13 }}>Role: {user?.role}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: Colors.error, marginTop: 20 }]}
        onPress={() => {
          Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', onPress: onLogout, style: 'destructive' },
          ]);
        }}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
