import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePOS } from '@/contexts/POSContext.jsx';
import InventoryItemCard from './InventoryItemCard';
import InventoryForm from './InventoryForm';
import { Input } from '@/components/ui/input';

const InventoryList = () => {
  const { inventory, updateInventoryItem, deleteInventoryItem } = usePOS();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (formData) => {
    updateInventoryItem(editingItem.id, formData);
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteInventoryItem(id);
    }
  };

  // Filter logic
  const filteredItems = inventory.filter(item => {
    const matchesName = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? item.category_name === categoryFilter : true;
    return matchesName && matchesCategory;
  });

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          type="search"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-black/20 border-amber-800/50 text-amber-100 max-w-xs"
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="w-full sm:w-48 h-10 px-3 rounded-md bg-black/20 border border-amber-800/50 text-amber-100"
        >
          <option value="">All Categories</option>
          {[...new Set(inventory.map(item => item.category_name).filter(Boolean))].map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <InventoryItemCard
              item={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item.id)}
            />
          </motion.div>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-effect border-amber-800/50">
          <DialogHeader>
            <DialogTitle className="text-amber-100">Edit Item</DialogTitle>
          </DialogHeader>
          <InventoryForm
            item={editingItem}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InventoryList;
