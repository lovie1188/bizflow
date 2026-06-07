import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, AlertCircle, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { fetchApi } from '../../utils/api';
import AdminStaff from './AdminStaff';

const AdminDashboard = () => {
  const [data, setData] = useState({
    orders: [],
    invoices: [],
    totalOutstanding: 0,
    unpaidCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetchApi('/dashboard');
        setData(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: '40px', color: 'var(--color-danger)' }}>Error: {error}</div>;

  // Use pre-computed server-side aging buckets
  const aging = data.aging || { safe: 0, monitor: 0, warning: 0, critical: 0 };
  const activeOrders = data.orders.filter(o => o.status === 'pending' || o.status === 'dispatched');

  const kpis = [
    { title: 'Revenue This Month', value: `₹${(data.revenueThisMonth || 0).toLocaleString('en-IN')}`, change: 'Paid Invoices', isPositive: true, icon: <IndianRupee size={24} /> },
    { title: 'Outstanding Payments', value: `₹${(data.totalOutstanding || 0).toLocaleString('en-IN')}`, change: `${data.unpaidCount || 0} Invoices`, isPositive: false, icon: <TrendingUp size={24} /> },
    { title: 'Active Orders', value: activeOrders.length.toString(), change: `${data.orders.filter(o => o.status === 'pending').length} Pending`, isPositive: true, icon: <ShoppingBag size={24} /> },
    { title: 'Critical Dues (45+ Days)', value: `₹${aging.critical.toLocaleString('en-IN')}`, change: 'Needs Action', isPositive: false, icon: <AlertCircle size={24} color="var(--color-danger)" /> }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-muted)' }}>Welcome back, here's what's happening with your wholesale business today.</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={18} /> New Order
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {kpis.map((kpi, i) => (
          <div key={i} className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: 'var(--color-secondary)' }}>
                {kpi.icon}
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, color: kpi.isPositive ? '#10B981' : 'var(--color-danger)', background: kpi.isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(236, 72, 153, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                {kpi.change}
              </span>
            </div>
            <h3 style={{ fontSize: '28px', marginBottom: '4px' }}>{kpi.value}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{kpi.title}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Orders Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px' }}>Recent Orders</h2>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>View All</button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'left' }}>
                <th style={{ padding: '12px 0' }}>Order ID</th>
                <th style={{ padding: '12px 0' }}>Buyer</th>
                <th style={{ padding: '12px 0' }}>Amount</th>
                <th style={{ padding: '12px 0' }}>Status</th>
                <th style={{ padding: '12px 0', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>No recent orders.</td></tr>
              ) : data.orders.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 0', fontWeight: 500 }}>{row.order_number}</td>
                  <td style={{ padding: '16px 0', color: 'var(--text-muted)' }}>Buyer ID: {row.buyer_entity_id}</td>
                  <td style={{ padding: '16px 0' }}>₹{parseFloat(row.grand_total || row.total_amount || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '16px 0' }}>
                    <span style={{ 
                      fontSize: '12px', padding: '4px 8px', borderRadius: '4px',
                      background: row.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: row.status === 'pending' ? '#F59E0B' : '#10B981'
                    }}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 0', textAlign: 'right' }}>
                    <button style={{ background: 'transparent', color: 'var(--color-primary)' }}><ArrowUpRight size={20} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 45-Day Tracker Widget */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '24px' }}>MSME 45-Day Compliance</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }}></div>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Safe (0-15 Days)</span>
              </div>
              <span style={{ fontWeight: 500 }}>₹{aging.safe.toLocaleString('en-IN')}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }}></div>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Monitor (16-30 Days)</span>
              </div>
              <span style={{ fontWeight: 500 }}>₹{aging.monitor.toLocaleString('en-IN')}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F97316' }}></div>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Warning (31-44 Days)</span>
              </div>
              <span style={{ fontWeight: 500 }}>₹{aging.warning.toLocaleString('en-IN')}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '8px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-danger)' }}></div>
                <span style={{ fontSize: '14px', color: 'var(--color-danger)', fontWeight: 500 }}>Critical (45+ Days)</span>
              </div>
              <span style={{ fontWeight: 'bold', color: 'var(--color-danger)' }}>₹{aging.critical.toLocaleString('en-IN')}</span>
            </div>
          </div>
          
          <button className="btn-secondary" style={{ width: '100%', marginTop: '24px', fontSize: '14px' }}>View Aging Report</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
