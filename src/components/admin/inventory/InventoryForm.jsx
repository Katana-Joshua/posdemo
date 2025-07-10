import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePOS } from '@/contexts/POSContext.jsx';
import { toast } from '@/components/ui/use-toast';

const InventoryForm = ({ item, onSubmit, onCancel }) => {
  const { categories } = usePOS();
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    cost_price: '',
    stock: '',
    low_stock_alert: '',
    image: ''
  });
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        category_id: item.category_id || '',
        price: item.price?.toString() || '',
        cost_price: item.cost_price?.toString() || '',
        stock: item.stock?.toString() || '',
        low_stock_alert: item.low_stock_alert?.toString() || '',
        image: item.image || ''
      });
      setPreviewImage(item.image || null);
    }
  }, [item]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock || !formData.cost_price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Name, Price, Cost Price, Stock)",
        variant: "destructive"
      });
      return;
    }

    onSubmit({
      name: formData.name,
      description: formData.description || '',
      price: parseFloat(formData.price),
      cost_price: parseFloat(formData.cost_price),
      stock: parseInt(formData.stock),
      low_stock_alert: parseInt(formData.low_stock_alert) || 5,
      category_id: formData.category_id || null,
      image: formData.image || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-amber-200">Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-black/20 border-amber-800/50 text-amber-100"
            required
          />
        </div>
        <div>
          <Label className="text-amber-200">Category</Label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full h-10 px-3 rounded-md bg-black/20 border border-amber-800/50 text-amber-100"
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-amber-200">Selling Price (UGX) *</Label>
          <Input
            type="number"
            step="100"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="bg-black/20 border-amber-800/50 text-amber-100"
            required
          />
        </div>
        <div>
          <Label className="text-amber-200">Cost Price (UGX) *</Label>
          <Input
            type="number"
            step="100"
            value={formData.cost_price}
            onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
            className="bg-black/20 border-amber-800/50 text-amber-100"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-amber-200">Stock *</Label>
          <Input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            className="bg-black/20 border-amber-800/50 text-amber-100"
            required
          />
        </div>
        <div>
          <Label className="text-amber-200">Low Stock Alert</Label>
          <Input
            type="number"
            value={formData.low_stock_alert}
            onChange={(e) => setFormData({ ...formData, low_stock_alert: e.target.value })}
            className="bg-black/20 border-amber-800/50 text-amber-100"
            placeholder="5"
          />
        </div>
      </div>
      <div>
        <Label className="text-amber-200">Image</Label>
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="bg-black/20 border-amber-800/50 text-amber-100 file:text-amber-200 file:bg-amber-800/50 file:border-0 file:rounded-md file:mr-2 file:px-2"
        />
        {previewImage && (
          <img src={previewImage} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-md" />
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
          {item ? "Update Item" : "Add Item"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default InventoryForm;
