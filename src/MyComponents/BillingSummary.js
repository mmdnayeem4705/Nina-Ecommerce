import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './Cart.css';  

const couponRules = {
  SAVE10: { label: 'SAVE10', description: 'Get 10% off', type: 'percent', value: 10 },
  BIG20: { label: 'BIG20', description: '20% off', type: 'percent', value: 20 },
  OFF50: { label: 'OFF50', description: 'Flat $50 off', type: 'flat', value: 50 },
  OFF99: { label: 'OFF99', description: 'Flat $99 off', type: 'flat', value: 99 },
};

export default function BillingSummary({ cart, setCart, user }) {
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState('Enter a coupon code to save more.');
  const [orderLoading, setOrderLoading] = useState(false);

  const cartWithQty = cart.map(item => ({
    ...item,
    quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1
  }));

  const total = cartWithQty.reduce(
    (sum, item) => sum + ((item.price || 0) * item.quantity),
    0
  );
  const shipping = total > 0 ? (total >= 300 ? 0 : 30) : 0;
  const coupon = appliedCoupon ? couponRules[appliedCoupon.toUpperCase()] : null;
  const discount = coupon
    ? coupon.type === 'percent'
      ? Math.min(total * (coupon.value / 100), total)
      : Math.min(coupon.value, total)
    : 0;
  const finalTotal = Math.max(0, total - discount + shipping);

  const handleApplyCoupon = () => {
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) {
      setCouponMessage('Please enter a coupon code.');
      return;
    }
    const rule = couponRules[normalized];
    if (!rule) {
      setCouponMessage('Coupon not valid. Try SAVE10, OFF50, OFF99, or BIG20.');
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(normalized);
    setCouponMessage(`Coupon ${normalized} applied! ${rule.description}.`);
  };

  const handleClearCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMessage('Enter a coupon code to save more.');
  };

  const handleConfirmOrder = async () => {
    if (!user) {
      alert('Please sign in to confirm your order.');
      return;
    }
    if (cartWithQty.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    setOrderLoading(true);
    try {
      const userDoc = await getDoc(firestoreDoc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        items: cartWithQty,
        createdAt: serverTimestamp(),
        userInfo: {
          fullName: userData.fullName || user.displayName || '',
          email: userData.email || user.email || '',
          phone: userData.phone || user.phoneNumber || '',
          address: userData.address || '',
        },
        coupon: coupon ? coupon.label : null,
        discount,
        shipping,
        total: finalTotal,
      });
      setCart([]);
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponMessage('Order confirmed and coupon cleared.');
      alert('Order confirmed and saved!');
      navigate('/');
    } catch (error) {
      alert('Failed to confirm order. Please try again.\n' + error.message);
    }
    setOrderLoading(false);
  };

  if (cartWithQty.length === 0) {
    return (
      <div className="container my-4">
        <h2 className="text-center mb-4" style={{ color: '#F97316' }}>Billing Summary</h2>
        <div className="text-center py-5" style={{ background: '#fff7ed', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          <p className="mb-4" style={{ fontSize: '1.1rem', color: '#6c757d' }}>Your cart is empty. Add items before checking out.</p>
          <Link to="/products" className="btn btn-primary">Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <h2 className="text-center mb-4" style={{ color: '#F97316' }}>Billing Summary</h2>
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-7">
          <div className="card p-4" style={{ borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', background: '#fff' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 style={{ fontWeight: 700, color: '#1f2937' }}>Order Summary</h4>
                <p style={{ margin: 0, color: '#6b7280' }}>Apply a coupon below and confirm your order.</p>
              </div>
              <Link to="/cart" className="btn btn-outline-secondary">Back to Cart</Link>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span style={{ fontWeight: 500 }}>Total</span>
              <span style={{ fontWeight: 600 }}>${total.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span style={{ fontWeight: 500 }}>Discount</span>
              <span style={{ color: discount > 0 ? '#198754' : '#888', fontWeight: 600 }}>
                {discount > 0 ? `- $${discount.toFixed(2)} (${coupon.description})` : '-'}
              </span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span style={{ fontWeight: 500 }}>Shipping</span>
              <span style={{ color: shipping === 0 ? '#198754' : '#F97316', fontWeight: 600 }}>
                {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            <hr />
            <div className="d-flex justify-content-between mb-4">
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Payable</span>
              <span style={{ fontWeight: 700, color: '#F97316', fontSize: '1.1rem' }}>${finalTotal.toFixed(2)}</span>
            </div>
            <div className="mb-4">
              <h5 style={{ fontWeight: 700, color: '#F97316', marginBottom: 16 }}>Apply Coupon</h5>
              <div className="d-flex flex-column flex-sm-row gap-2 align-items-start">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button className="btn btn-primary" onClick={handleApplyCoupon}>Apply</button>
                {appliedCoupon && (
                  <button className="btn btn-outline-secondary" onClick={handleClearCoupon}>Clear</button>
                )}
              </div>
              <p className="mt-3" style={{ color: appliedCoupon ? '#198754' : '#6c757d', fontWeight: 600 }}>{couponMessage}</p>
              <div className="d-flex flex-wrap gap-2">
                {Object.values(couponRules).map(couponItem => (
                  <div key={couponItem.label} className="coupon-chip">
                    <strong>{couponItem.label}</strong>
                    <div className="coupon-chip-desc">{couponItem.description}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center">
              <button
                className="btn"
                style={{
                  background: '#F97316',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: 8,
                  padding: '12px 42px',
                  fontSize: '1.05rem',
                  boxShadow: '0 2px 10px rgba(249,115,22,0.12)',
                  border: 'none',
                  letterSpacing: 1,
                }}
                onClick={handleConfirmOrder}
                disabled={orderLoading || cartWithQty.length === 0}
              >
                {orderLoading ? 'Confirming...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
