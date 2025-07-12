import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePOS } from '@/contexts/POSContext';
import { toast } from '@/components/ui/use-toast';
import { CreditCard, Banknote, Smartphone, Mail, Printer, Rocket, BookUser, User } from 'lucide-react';

const Receipt = React.forwardRef(({ sale, cart }, ref) => {
  if (!sale) return null;
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const subtotal = total; // If you have discounts, update this
  const tax = 0; // If you have tax logic, update this
  const receiptNumber = sale.receiptNumber || sale.receipt_number || '';
  const timestamp = sale.timestamp || sale.created_at || '';
  const customerName = sale.customerInfo?.name || sale.customer_info?.name || '';
  const business = {
    name: 'Moon Land POS',
    address: '', // Add address if available
    phone: '',   // Add phone if available
  };
  const footer = 'Thank you for your visit!';
  return (
    <div ref={ref} className="receipt-print">
      <style>{`
        @media print {
          .receipt-print {
            width: 80mm;
            max-width: 80mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            background: #fff;
            margin: 0 auto;
            padding: 0;
          }
        }
        .receipt-print {
          width: 80mm;
          max-width: 80mm;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          color: #000;
          background: #fff;
          margin: 0 auto;
          padding: 0;
        }
        .receipt-center { text-align: center; }
        .receipt-bold { font-weight: bold; }
        .receipt-row { display: flex; justify-content: space-between; font-size: 12px; }
        .receipt-hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
        .receipt-items-header { font-weight: bold; border-bottom: 1px solid #000; }
        .receipt-qr { display: flex; flex-direction: column; align-items: center; margin-top: 8px; }
      `}</style>
      <div className="receipt-center receipt-bold" style={{marginBottom: 4}}>{business.name}</div>
      {business.address && <div className="receipt-center">{business.address}</div>}
      {business.phone && <div className="receipt-center">{business.phone}</div>}
      <div className="receipt-center">{timestamp ? new Date(timestamp).toLocaleString() : ''}</div>
      <div className="receipt-center">Receipt #{receiptNumber}</div>
      {sale.paymentMethod === 'credit' && (
        <div className="receipt-center receipt-bold">CREDIT SALE FOR: {customerName}</div>
      )}
      <hr className="receipt-hr" />
      <div className="receipt-row receipt-items-header">
        <span style={{flex: 2}}>Item</span>
        <span style={{flex: 1, textAlign: 'right'}}>Qty</span>
        <span style={{flex: 1, textAlign: 'right'}}>Price</span>
        <span style={{flex: 1, textAlign: 'right'}}>Total</span>
      </div>
      {cart.map(item => (
        <div key={item.id} className="receipt-row">
          <span style={{flex: 2}}>{item.name}</span>
          <span style={{flex: 1, textAlign: 'right'}}>{item.quantity}</span>
          <span style={{flex: 1, textAlign: 'right'}}>{item.price.toLocaleString()}</span>
          <span style={{flex: 1, textAlign: 'right'}}>{(item.price * item.quantity).toLocaleString()}</span>
        </div>
      ))}
      <hr className="receipt-hr" />
      <div className="receipt-row">
        <span>Subtotal:</span>
        <span>{subtotal.toLocaleString()}</span>
      </div>
      <div className="receipt-row">
        <span>Tax:</span>
        <span>{tax.toLocaleString()}</span>
      </div>
      <div className="receipt-row receipt-bold">
        <span>Total:</span>
        <span>{total.toLocaleString()}</span>
      </div>
      <hr className="receipt-hr" />
      <div className="receipt-qr">
        {receiptNumber && (
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(receiptNumber)}`}
            alt="QR Code"
            style={{ margin: '0 auto', display: 'block' }}
          />
        )}
        {receiptNumber && <div>Order: {receiptNumber}</div>}
      </div>
      <div className="receipt-center" style={{marginTop: 8}}>{footer}</div>
    </div>
  );
});

const PaymentModal = ({ isOpen, onClose }) => {
  const { cart, processSale, refreshInventory } = usePOS();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerInfo, setCustomerInfo] = useState({ name: '', contact: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [lastCart, setLastCart] = useState([]);

  const receiptRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    onAfterPrint: () => {
      refreshInventory();
    },
  });

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'mobile', label: 'Mobile Money', icon: Smartphone },
    { id: 'credit', label: 'Credit', icon: BookUser },
  ];

  const handlePayment = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const currentCart = [...cart];
    const sale = await processSale({ paymentMethod, customerInfo });
    if (sale) {
      // Normalize fields for receipt
      const normalizedSale = {
        ...sale,
        receiptNumber: sale.receiptNumber || sale.receipt_number || '',
        timestamp: sale.timestamp || sale.created_at || '',
        customerInfo: sale.customerInfo || sale.customer_info || {},
      };
      setLastSale(normalizedSale);
      setLastCart(currentCart);
      setTimeout(() => {
        handlePrint();
      }, 500);
      setCustomerInfo({ name: '', contact: '' });
      setPaymentMethod('cash');
      onClose();
    }
    setIsProcessing(false);
  };

  const handleEmailReceipt = () => {
    toast({
      title: "Email Receipt",
      description: `🚧 Emailing receipts isn't implemented yet—but you can request it! 🚀`
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="glass-effect border-amber-800/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-100">Complete Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Order Summary */}
            <div className="p-4 bg-black/20 rounded-lg border border-amber-800/30">
              <h3 className="font-semibold text-amber-100 mb-3">Order Summary</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-amber-200/80">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="text-amber-100">
                      UGX {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-amber-800/30 mt-3 pt-3">
                <div className="flex justify-between font-bold">
                  <span className="text-amber-100">Total:</span>
                  <span className="text-amber-100">UGX {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <Label className="text-amber-200 mb-3 block">Payment Method</Label>
              <div className="grid grid-cols-4 gap-2">
                {paymentMethods.map(method => {
                  const Icon = method.icon;
                  return (
                    <Button
                      key={method.id}
                      variant={paymentMethod === method.id ? "default" : "outline"}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex flex-col items-center p-2 h-auto ${
                        paymentMethod === method.id 
                          ? 'bg-amber-600 hover:bg-amber-700' 
                          : 'border-amber-800/50 hover:bg-amber-950/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-xs text-center">{method.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Customer Info for Credit */}
            {paymentMethod === 'credit' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2 p-3 bg-amber-950/30 rounded-lg"
              >
                <Label className="text-amber-200">Customer Details (for Credit)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-amber-400" />
                  <Input
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="pl-10 bg-black/20 border-amber-800/50 text-amber-100"
                    placeholder="Customer Name"
                  />
                </div>
                 <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-amber-400" />
                  <Input
                    value={customerInfo.contact}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, contact: e.target.value })}
                    className="pl-10 bg-black/20 border-amber-800/50 text-amber-100"
                    placeholder="Contact (Phone/Email)"
                  />
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handlePayment}
                disabled={isProcessing || cart.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                {isProcessing ? 'Processing...' : `Complete Sale - UGX ${total.toLocaleString()}`}
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="border-amber-800/50 text-amber-100"
                  disabled={!lastSale}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Reprint Last
                </Button>
                <Button
                  onClick={handleEmailReceipt}
                  variant="outline"
                  className="border-amber-800/50 text-amber-100"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Receipt
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="hidden">
        <Receipt ref={receiptRef} sale={lastSale} cart={lastCart} />
      </div>
    </>
  );
};

export default PaymentModal;