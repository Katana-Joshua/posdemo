
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePOS } from '@/contexts/POSContext';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { useState } from 'react';

const CartItemPrice = ({ item }) => {
  const { updateCartItemPrice } = usePOS();
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(item.price);

  const handlePriceUpdate = () => {
    const newPrice = parseFloat(price);
    if (isNaN(newPrice)) {
      setPrice(item.price); // Reset to original cart price
      setIsEditing(false);
      return;
    }
    updateCartItemPrice(item.id, newPrice);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePriceUpdate();
    } else if (e.key === 'Escape') {
      setPrice(item.price);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        value={price}
        onChange={e => setPrice(e.target.value)}
        onBlur={handlePriceUpdate}
        onKeyDown={handleKeyDown}
        className="h-7 w-28 text-xs text-right bg-black/30 border-amber-600 rounded"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-xs text-amber-200/80 hover:text-amber-100 hover:underline flex items-center gap-1"
    >
      UGX {item.price.toLocaleString()} each
      <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h18" /></svg>
    </button>
  );
};

const Cart = ({ onCheckout }) => {
  const { cart, updateCartQuantity, removeFromCart, clearCart } = usePOS();

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Card className="glass-effect border-amber-800/50 sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center text-amber-100">
          <ShoppingCart className="w-5 h-5 mr-2" />
          Current Order ({cart.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-3">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-3 bg-black/20 rounded-lg border border-amber-800/30"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-100 text-sm">{item.name}</h4>
                    <CartItemPrice item={item} />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFromCart(item.id)}
                    className="h-6 w-6 p-0 hover:bg-red-950/50"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="h-6 w-6 p-0 border-amber-800/50"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-amber-100 font-semibold min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="h-6 w-6 p-0 border-amber-800/50"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="font-bold text-amber-100">
                    UGX {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 mx-auto text-amber-400/50 mb-2" />
            <p className="text-amber-200/60">Cart is empty</p>
          </div>
        ) : (
          <>
            <div className="border-t border-amber-800/30 pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-amber-100">Total:</span>
                <span className="text-2xl font-bold text-amber-100">UGX {total.toLocaleString()}</span>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={onCheckout}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Payment
                </Button>
                <Button
                  onClick={clearCart}
                  variant="outline"
                  className="w-full border-amber-800/50 text-amber-100 hover:bg-red-950/50"
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Cart;
