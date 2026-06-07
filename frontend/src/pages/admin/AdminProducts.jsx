import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Upload, Package } from 'lucide-react';
import { fetchApi, API_URL } from '../../utils/api';

const EMPTY_FORM = { name:'', sku:'', hsn:'', gstRate:'18', price:'', moq:'1', unit:'PCS', stock:'', category:'Ice Cream', description:'' };

const CATEGORIES = ['Ice Cream','Frozen','Dairy','Condiments','Bakery','Other'];
const UNITS      = ['PCS','KG','KGS','BAG','PKT','LTR','BOX'];
const GST_RATES  = ['0','5','12','18','28'];

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch]     = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [imgPreview, setImgPreview] = useState(null);
  const [imgFile, setImgFile] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);

  const categories = ['all', ...CATEGORIES];

  const loadProducts = async () => {
    try {
      setFetching(true);
      const res = await fetchApi('/products?limit=500');
      const mapped = (res?.data || []).map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku || '',
        hsn: p.hsn_code || '',
        gstRate: p.gst_rate || 0,
        price: parseFloat(p.trade_price || p.buy_price || 0),
        moq: p.min_order_qty || 1,
        unit: p.unit || 'PCS',
        stock: p.stock || 0,
        status: (p.stock || 0) < 20 ? 'Low Stock' : 'Active',
        category: p.category || 'Other',
        image_url: p.image_url,
        hsn_code: p.hsn_code,
        trade_price: p.trade_price,
        min_order_qty: p.min_order_qty
      }));
      setProducts(mapped);
    } catch(e) {
      console.error('Failed to load products:', e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const filtered = products.filter(p =>
    (catFilter === 'all' || p.category === catFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
     p.sku.toLowerCase().includes(search.toLowerCase()) ||
     p.hsn.includes(search))
  );

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setImgPreview(null); setImgFile(null); setShowModal(true); };
  const openEdit = (p) => {
    setForm({ name:p.name, sku:p.sku, hsn:p.hsn, gstRate:String(p.gstRate), price:String(p.price), moq:String(p.moq), unit:p.unit, stock:String(p.stock), category:p.category, description:'' });
    setEditId(p.id); 
    setImgPreview(p.image_url ? `${API_URL}${p.image_url}` : null); 
    setImgFile(null); 
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditId(null); setImgPreview(null); setImgFile(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('sku', form.sku);
    formData.append('hsn_code', form.hsn);
    formData.append('gst_rate', form.gstRate);
    formData.append('trade_price', form.price);
    formData.append('buy_price', form.price); // simplified
    formData.append('min_order_qty', form.moq);
    formData.append('unit', form.unit);
    formData.append('stock', form.stock);
    formData.append('category', form.category);
    if (imgFile) formData.append('image', imgFile);

    try {
      if (editId) {
        await fetchApi(`/products/${editId}`, { method: 'PUT', body: formData });
      } else {
        await fetchApi('/products', { method: 'POST', body: formData });
      }
      closeModal();
      loadProducts();
    } catch(err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => { 
    if (window.confirm('Delete this product?')) {
      try {
        await fetchApi(`/products/${id}`, { method: 'DELETE' });
        loadProducts();
      } catch(e) {
        alert(e.message);
      }
    } 
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px' }}>
        <div>
          <h1 style={{ fontSize:'28px', marginBottom:'8px' }}>Product Catalog</h1>
          <p style={{ color:'var(--text-muted)' }}>{products.length} products · {products.filter(p=>p.status==='Low Stock').length} low stock</p>
        </div>
        <button className="btn-primary" onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <Plus size={18}/> Add Product
        </button>
      </div>

      {/* Category filter tabs */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            style={{ padding:'7px 18px', borderRadius:'20px', fontFamily:'inherit', fontWeight:500, fontSize:'13px', cursor:'pointer',
              background: catFilter===c ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' : 'rgba(255,255,255,0.05)',
              color: catFilter===c ? 'white' : 'var(--text-muted)', border: catFilter===c ? 'none' : '1px solid var(--glass-border)' }}>
            {c.charAt(0).toUpperCase()+c.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:'20px', maxWidth:'420px' }}>
        <Search size={18} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input type="text" placeholder="Search by name, SKU or HSN…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ width:'100%', padding:'11px 16px 11px 44px', borderRadius:'var(--radius-md)', border:'1px solid var(--glass-border)', background:'rgba(255,255,255,0.05)', color:'var(--text-main)', fontFamily:'inherit', outline:'none' }}/>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding:'0', overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'900px' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--glass-border)', color:'var(--text-muted)', fontSize:'12px', textAlign:'left', background:'rgba(0,0,0,0.15)' }}>
              {['Product', 'SKU', 'HSN', 'Category', 'GST %', 'Price (ex-GST)', 'MOQ', 'Stock', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding:'14px 16px', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              <tr><td colSpan={10} style={{ padding:'48px', textAlign:'center', color:'var(--text-muted)' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'32px', height:'32px', border:'3px solid var(--glass-border)', borderTopColor:'var(--color-primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                  Loading products…
                </div>
              </td></tr>
            ) : filtered.length === 0 && (
              <tr><td colSpan={10} style={{ padding:'48px', textAlign:'center', color:'var(--text-muted)' }}>
                <Package size={40} style={{ marginBottom:'12px', opacity:0.3, display:'block', margin:'0 auto 12px' }}/>
                No products found
              </td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseOut={e  => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding:'14px 16px', fontWeight:500 }}>{p.name}</td>
                <td style={{ padding:'14px 16px', color:'var(--text-muted)', fontSize:'13px' }}>{p.sku}</td>
                <td style={{ padding:'14px 16px', color:'var(--text-muted)', fontSize:'13px' }}>{p.hsn}</td>
                <td style={{ padding:'14px 16px' }}>
                  <span style={{ fontSize:'12px', padding:'3px 8px', borderRadius:'4px', background:'rgba(6,182,212,0.1)', color:'var(--color-secondary)' }}>{p.category}</span>
                </td>
                <td style={{ padding:'14px 16px', color: p.gstRate===0 ? '#10B981' : 'var(--text-main)' }}>{p.gstRate}%</td>
                <td style={{ padding:'14px 16px', fontWeight:600 }}>₹{p.price.toLocaleString('en-IN')}</td>
                <td style={{ padding:'14px 16px', color:'var(--text-muted)' }}>{p.moq} {p.unit}</td>
                <td style={{ padding:'14px 16px', color: p.stock < 20 ? '#F59E0B' : 'inherit', fontWeight: p.stock < 20 ? 600 : 400 }}>{p.stock}</td>
                <td style={{ padding:'14px 16px' }}>
                  <span style={{ fontSize:'12px', padding:'3px 8px', borderRadius:'4px',
                    background: p.status==='Active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: p.status==='Active' ? '#10B981' : '#F59E0B' }}>{p.status}</span>
                </td>
                <td style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button onClick={() => openEdit(p)} style={{ background:'rgba(59,130,246,0.1)', border:'none', color:'var(--color-primary)', padding:'7px', borderRadius:'7px', cursor:'pointer' }}><Edit2 size={15}/></button>
                    <button onClick={() => handleDelete(p.id)} style={{ background:'rgba(236,72,153,0.1)', border:'none', color:'var(--color-danger)', padding:'7px', borderRadius:'7px', cursor:'pointer' }}><Trash2 size={15}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderTop:'1px solid var(--glass-border)' }}>
          <span style={{ color:'var(--text-muted)', fontSize:'13px' }}>Showing {filtered.length} of {products.length} products</span>
        </div>
      </div>

      {/* ─── ADD / EDIT MODAL ─── */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {/* Backdrop */}
          <div onClick={closeModal} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)' }}/>

          {/* Modal Box */}
          <div className="glass-panel" style={{ position:'relative', width:'100%', maxWidth:'620px', maxHeight:'90vh', overflowY:'auto', padding:'32px', zIndex:1 }}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'28px' }}>
              <h2 style={{ fontSize:'22px' }}>{editId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={closeModal} style={{ background:'rgba(255,255,255,0.08)', border:'none', color:'var(--text-muted)', padding:'8px', borderRadius:'50%', cursor:'pointer' }}><X size={20}/></button>
            </div>

            <form onSubmit={handleSave}>
              {/* Image Upload */}
              <div onClick={() => document.getElementById('imgUpload').click()}
                style={{ height:'130px', border:'2px dashed var(--glass-border)', borderRadius:'var(--radius-md)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px', cursor:'pointer', marginBottom:'24px', background: imgPreview ? `url(${imgPreview}) center/cover no-repeat` : 'rgba(255,255,255,0.03)', color:'var(--text-muted)', transition:'border-color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.borderColor='var(--color-primary)'}
                onMouseOut={e  => e.currentTarget.style.borderColor='var(--glass-border)'}>
                {!imgPreview && <><Upload size={28}/><span style={{ fontSize:'14px' }}>Click to upload product image</span></>}
                <input id="imgUpload" type="file" accept="image/*" style={{ display:'none' }} onChange={e => { 
                  if(e.target.files[0]) {
                    setImgFile(e.target.files[0]);
                    setImgPreview(URL.createObjectURL(e.target.files[0])); 
                  }
                }}/>
              </div>

              {/* Fields */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                {/* Product Name – full width */}
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ fontSize:'12px', color:'var(--text-muted)', display:'block', marginBottom:'6px' }}>Product Name *</label>
                  <input required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Vadilal Blk Vanilla 5 Ltr"
                    style={{ width:'100%', padding:'11px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'rgba(255,255,255,0.05)', color:'var(--text-main)', fontFamily:'inherit', outline:'none' }}/>
                </div>

                {[
                  { key:'sku',     label:'SKU *',           placeholder:'VAD-VAN-5L' },
                  { key:'hsn',     label:'HSN Code *',      placeholder:'21050000'   },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize:'12px', color:'var(--text-muted)', display:'block', marginBottom:'6px' }}>{f.label}</label>
                    <input required value={form[f.key]} onChange={e => setForm(fm=>({...fm,[f.key]:e.target.value}))} placeholder={f.placeholder}
                      style={{ width:'100%', padding:'11px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'rgba(255,255,255,0.05)', color:'var(--text-main)', fontFamily:'inherit', outline:'none' }}/>
                  </div>
                ))}

                {/* GST Rate */}
                <div>
                  <label style={{ fontSize:'12px', color:'var(--text-muted)', display:'block', marginBottom:'6px' }}>GST Rate *</label>
                  <select value={form.gstRate} onChange={e => setForm(f=>({...f,gstRate:e.target.value}))}
                    style={{ width:'100%', padding:'11px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'rgba(15,23,42,0.95)', color:'var(--text-main)', fontFamily:'inherit', outline:'none' }}>
                    {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label style={{ fontSize:'12px', color:'var(--text-muted)', display:'block', marginBottom:'6px' }}>Unit *</label>
                  <select value={form.unit} onChange={e => setForm(f=>({...f,unit:e.target.value}))}
                    style={{ width:'100%', padding:'11px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'rgba(15,23,42,0.95)', color:'var(--text-main)', fontFamily:'inherit', outline:'none' }}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label style={{ fontSize:'12px', color:'var(--text-muted)', display:'block', marginBottom:'6px' }}>Category *</label>
                  <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}
                    style={{ width:'100%', padding:'11px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'rgba(15,23,42,0.95)', color:'var(--text-main)', fontFamily:'inherit', outline:'none' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label style={{ fontSize:'12px', color:'var(--text-muted)', display:'block', marginBottom:'6px' }}>Price (Ex-GST) ₹ *</label>
                  <input required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} placeholder="475.00"
                    style={{ width:'100%', padding:'11px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'rgba(255,255,255,0.05)', color:'var(--text-main)', fontFamily:'inherit', outline:'none' }}/>
                </div>

                {/* MOQ */}
                <div>
                  <label style={{ fontSize:'12px', color:'var(--text-muted)', display:'block', marginBottom:'6px' }}>Min. Order Qty</label>
                  <input type="number" min="1" value={form.moq} onChange={e => setForm(f=>({...f,moq:e.target.value}))} placeholder="1"
                    style={{ width:'100%', padding:'11px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'rgba(255,255,255,0.05)', color:'var(--text-main)', fontFamily:'inherit', outline:'none' }}/>
                </div>

                {/* Stock */}
                <div>
                  <label style={{ fontSize:'12px', color:'var(--text-muted)', display:'block', marginBottom:'6px' }}>Current Stock *</label>
                  <input required type="number" min="0" value={form.stock} onChange={e => setForm(f=>({...f,stock:e.target.value}))} placeholder="100"
                    style={{ width:'100%', padding:'11px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'rgba(255,255,255,0.05)', color:'var(--text-main)', fontFamily:'inherit', outline:'none' }}/>
                </div>

                {/* GST preview */}
                {form.price && (
                  <div style={{ gridColumn:'1/-1', padding:'12px 16px', background:'rgba(59,130,246,0.08)', borderRadius:'var(--radius-sm)', border:'1px solid rgba(59,130,246,0.2)', fontSize:'13px' }}>
                    Ex-GST: ₹{Number(form.price).toFixed(2)} + GST {form.gstRate}% (₹{(Number(form.price) * Number(form.gstRate) / 100).toFixed(2)}) = <strong>₹{(Number(form.price) * (1 + Number(form.gstRate)/100)).toFixed(2)} incl. GST</strong>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end', marginTop:'28px' }}>
                <button type="button" onClick={closeModal} className="btn-secondary" style={{ padding:'11px 24px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding:'11px 32px', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Saving…' : editId ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
