import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePOS } from '@/contexts/POSContext';
import { Plus, Search, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

const MenuGrid = () => {
  const { inventory, addToCart, categories } = usePOS();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const displayCategories = [{ name: 'All', image: null }, ...categories];

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category_name === selectedCategory;
    return matchesSearch && matchesCategory && item.stock > 0;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-amber-400" />
          <Input
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/20 border-amber-800/50 text-amber-100 placeholder:text-amber-300/50"
          />
        </div>
      </div>
      
      {/* Category Filter */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {displayCategories.map(category => (
          <motion.div
            key={category.name}
            whileHover={{ y: -4 }}
            className="flex-shrink-0"
          >
            <button
              onClick={() => setSelectedCategory(category.name)}
              className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                selectedCategory === category.name 
                  ? 'border-amber-500 scale-105' 
                  : 'border-transparent hover:border-amber-700'
              }`}
            >
              {category.image ? (
                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-900 to-amber-950 flex items-center justify-center">
                  <span className="text-amber-200 font-bold text-sm">{category.name}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-center text-sm drop-shadow-md">{category.name}</span>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="glass-effect border-amber-800/50 hover:border-amber-600/50 transition-all cursor-pointer group">
              <CardContent className="p-4">
                <div className="aspect-square mb-3 bg-white rounded-lg flex items-center justify-center">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-900 to-amber-950 flex items-center justify-center">
                      <span className="text-amber-300 text-4xl font-bold">
                        {item.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-amber-100 line-clamp-1">{item.name}</h3>
                  <p className="text-sm text-amber-200/80">{item.category_name || 'Uncategorized'}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-amber-100">
                      UGX {item.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-amber-200/60">
                      Stock: {item.stock}
                    </span>
                  </div>

                  <Button
                    onClick={() => addToCart(item)}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                    disabled={item.stock === 0}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-amber-200/60">No items found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default MenuGrid;