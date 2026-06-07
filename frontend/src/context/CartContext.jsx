import React, { createContext, useContext, useState, useEffect } from 'react';
import { showToast } from '../components/ui/Toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem('bizflow_cart');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('bizflow_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, qty: item.qty + quantity } : item
        );
      }
      return [...prev, { ...product, qty: quantity }];
    });
    showToast(`${product.name} (Qty: ${quantity}) added to cart!`, 'success');
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(prev => 
      prev.map(item => 
        item.id === productId ? { ...item, qty: newQuantity } : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const gstTotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty * item.gstRate / 100), 0);
  const grandTotal = subtotal + gstTotal;

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      subtotal,
      gstTotal,
      grandTotal,
      itemCount: cartItems.length
    }}>
      {children}
    </CartContext.Provider>
  );
};
