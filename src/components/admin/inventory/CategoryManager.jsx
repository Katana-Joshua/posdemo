import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePOS } from '@/contexts/POSContext.jsx';
import { Edit, Trash2, ImagePlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const CategoryManager = () => {
  const { categories, addCategory, removeCategory, updateCategory, refreshInventory } = usePOS();
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', image: '' });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const categoryFileInputRef = useRef(null);

  const handleAddCategory = async () => {
    if (newCategory.trim()) {
      await addCategory(newCategory.trim());
      setNewCategory('');
      refreshInventory && refreshInventory();
    }
  };

  const handleCategoryImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(form => ({ ...form, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openCategoryEdit = (category) => {
    setEditingCategory(category);
    setEditForm({ name: category.name, image: category.image || '' });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await updateCategory(editingCategory.id, { name: editForm.name, image: editForm.image });
    setIsEditDialogOpen(false);
    setEditingCategory(null);
    refreshInventory && refreshInventory();
  };

  const handleDeleteCategory = async (id) => {
    await removeCategory(id);
    refreshInventory && refreshInventory();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          className="bg-black/20 border-amber-800/50 text-amber-100"
        />
        <Button onClick={handleAddCategory} className="bg-amber-600 hover:bg-amber-700">Add</Button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between p-2 bg-black/20 rounded-md">
            <div className="flex items-center gap-3">
              {cat.image ? (
                <img src={cat.image} alt={cat.name} className="w-10 h-10 rounded-md object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-md bg-amber-950/50 flex items-center justify-center">
                  <ImagePlus className="w-5 h-5 text-amber-500" />
                </div>
              )}
              <span className="text-amber-100">{cat.name}</span>
            </div>
            <div className="flex items-center">
              <Button size="sm" variant="ghost" onClick={() => openCategoryEdit(cat)}>
                <Edit className="w-4 h-4 text-amber-400" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(cat.id)}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-effect border-amber-800/50">
          <DialogHeader>
            <DialogTitle className="text-amber-100">Edit Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              value={editForm.name}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Category name"
              className="bg-black/20 border-amber-800/50 text-amber-100"
              required
            />
            <input
              type="file"
              ref={categoryFileInputRef}
              onChange={handleCategoryImageChange}
              accept="image/*"
              className="bg-black/20 border-amber-800/50 text-amber-100"
            />
            {editForm.image && (
              <img src={editForm.image} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-md" />
            )}
            <div className="flex gap-2">
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">Save</Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManager;
