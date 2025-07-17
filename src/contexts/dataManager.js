import { toast } from '@/components/ui/use-toast';

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// --- Cart Management ---
export const handleAddToCart = (item, cart, setCart) => {
  const existingItem = cart.find(cartItem => cartItem.id === item.id);
  if (existingItem) {
    setCart(cart.map(cartItem =>
      cartItem.id === item.id
        ? { ...cartItem, quantity: cartItem.quantity + 1 }
        : cartItem
    ));
  } else {
    setCart([...cart, { ...item, quantity: 1 }]);
  }
};

export const handleUpdateCartQuantity = (itemId, quantity, cart, setCart) => {
  if (quantity <= 0) {
    setCart(cart.filter(item => item.id !== itemId));
    return;
  }
  setCart(cart.map(item =>
    item.id === itemId ? { ...item, quantity } : item
  ));
};

// --- Sale Processing ---
export const handleProcessSale = (
  { paymentMethod, customerInfo },
  { cart, inventory, currentShift, sales },
  { setCart, setInventory, setSales }
) => {
  if (cart.length === 0) {
    toast({ title: "Error", description: "Cart is empty", variant: "destructive" });
    return null;
  }

  if (paymentMethod === 'credit' && !customerInfo?.name) {
    toast({ title: "Error", description: "Customer name is required for credit sales.", variant: "destructive" });
    return null;
  }

  const receiptNumber = generateId('RCP');
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCost = cart.reduce((sum, item) => sum + ((item.costPrice || 0) * item.quantity), 0);

  const sale = {
    id: receiptNumber,
    receiptNumber,
    items: [...cart],
    total,
    totalCost,
    profit: total - totalCost,
    paymentMethod,
    customerInfo,
    status: paymentMethod === 'credit' ? 'unpaid' : 'paid',
    timestamp: new Date().toISOString(),
    cashier: currentShift?.cashierName || 'Unknown'
  };

  const updatedInventory = inventory.map(item => {
    const cartItem = cart.find(ci => ci.id === item.id);
    if (cartItem) {
      return { ...item, stock: item.stock - cartItem.quantity };
    }
    return item;
  });

  setInventory(updatedInventory);
  setSales([...sales, sale]);
  setCart([]);

  toast({
    title: "Sale Completed",
    description: `Receipt #${receiptNumber} - Total: UGX ${total.toLocaleString()}`
  });

  return sale;
};

export const handlePayCreditSale = (saleId, sales, setSales) => {
    setSales(sales.map(sale => 
        sale.id === saleId ? { ...sale, status: 'paid', paidAt: new Date().toISOString() } : sale
    ));
    toast({
        title: "Credit Sale Paid",
        description: "The sale has been marked as paid."
    });
};


// --- Other Actions ---
export const handleAddExpense = (expense, { expenses, currentShift }, setExpenses) => {
  const newExpense = {
    id: generateId('exp'),
    ...expense,
    timestamp: new Date().toISOString(),
    cashier: currentShift?.cashierName || 'Admin'
  };
  setExpenses([...expenses, newExpense]);
  toast({
    title: "Expense Recorded",
    description: `${expense.description} - UGX ${expense.amount.toLocaleString()}`
  });
};

export const handleAddInventoryItem = (item, inventory, setInventory) => {
  const newItem = { ...item, id: generateId('item') };
  setInventory([...inventory, newItem]);
  toast({ title: "Item Added", description: `${item.name} has been added.` });
};

export const handleUpdateInventoryItem = (id, updatedItem, inventory, setInventory) => {
  setInventory(inventory.map(item => (item.id === id ? { ...item, ...updatedItem } : item)));
  toast({ title: "Item Updated", description: `${updatedItem.name} has been updated.` });
};

export const handleDeleteInventoryItem = (id, inventory, setInventory) => {
  const item = inventory.find(item => item.id === id);
  setInventory(inventory.filter(item => item.id !== id));
  toast({ title: "Item Deleted", description: `${item?.name} has been removed.` });
};

export const handleAddStaffMember = (staffMember, staff, setStaff) => {
  const newStaff = { ...staffMember, id: generateId('staff') };
  setStaff([...staff, newStaff]);
  toast({ title: "Staff Added", description: `${staffMember.name} has been added.` });
};

export const handleRemoveStaffMember = (staffId, staff, setStaff) => {
  const staffMember = staff.find(s => s.id === staffId);
  setStaff(staff.filter(s => s.id !== staffId));
  toast({ title: "Staff Removed", description: `${staffMember?.name} has been removed.`, variant: "destructive" });
};