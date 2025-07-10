import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Package, TrendingUp } from 'lucide-react';

// Utility to strip leading zeros
const stripLeadingZeros = num => {
  if (typeof num === 'number') return num;
  if (typeof num === 'string') return num.replace(/^0+(?!$)/, '');
  return num;
};

const InventoryItemCard = ({ item, onEdit, onDelete }) => {
  const profitMargin = item.price && item.cost_price ? ((item.price - item.cost_price) / item.price) * 100 : 0;

  return (
    <Card className="glass-effect border-amber-800/50 hover:border-amber-600/50 transition-colors h-full flex flex-col">
      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-amber-100">{item.name}</h3>
            <p className="text-sm text-amber-200/80">{item.category_name || 'Uncategorized'}</p>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              
              className="h-8 w-8 p-0 hover:bg-amber-950/50"
            >
              <Edit className="w-4 h-4 text-amber-400" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-8 w-8 p-0 hover:bg-red-950/50"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
          </div>
        </div>

        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-32 object-cover rounded-md mb-3"
          />
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-amber-900 to-amber-950 flex items-center justify-center rounded-md mb-3">
            <Package className="w-12 h-12 text-amber-500/50" />
          </div>
        )}

        <div className="space-y-2 mt-auto">
          <div className="flex justify-between">
            <span className="text-amber-200/80">Cost:</span>
            <span className="font-semibold text-amber-100">UGX {stripLeadingZeros(item.cost_price)?.toLocaleString() || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-200/80">Price:</span>
            <span className="font-semibold text-amber-100">UGX {stripLeadingZeros(item.price).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-200/80">Stock:</span>
            <span className={`font-semibold ${item.stock <= item.low_stock_alert ? 'text-red-400' : 'text-amber-100'}`}>
              {item.stock}
            </span>
          </div>
          {item.stock <= item.low_stock_alert && (
            <div className="flex items-center text-red-400 text-sm">
              <Package className="w-4 h-4 mr-1" />
              Low Stock Alert
            </div>
          )}
          {item.price && item.cost_price && (
            <div className="flex items-center text-green-400 text-sm pt-2 border-t border-amber-800/30">
              <TrendingUp className="w-4 h-4 mr-1" />
              Profit Margin: {profitMargin.toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryItemCard;
