'use client';

import React, { useState, useMemo } from 'react';
// import { SortButton, SortDirection } from '@/components/SortButton';

// Interface for our product items
interface Product {
  id: number;
  name: string;
  price: number;
}

// Mock initial data
const initialProducts: Product[] = [
  { id: 1, name: 'Premium Wireless Headphones', price: 199.99 },
  { id: 2, name: 'Ergonomic Mechanical Keyboard', price: 129.50 },
  { id: 3, name: 'Ultra-wide 4K Monitor', price: 449.00 },
  { id: 4, name: 'High-Precision Gaming Mouse', price: 75.25 },
  { id: 5, name: 'USB-C Docking Station', price: 89.00 },
];

// export default function ProductsPage() {
//   // 1. State for the current sort direction
//   const [sortOrder, setSortOrder] = useState<SortDirection>('asc');

//   // 2. Dynamic sorting logic using useMemo for performance
//   const sortedProducts = useMemo(() => {
//     // We spread into a new array to avoid mutating the original data
//     return [...initialProducts].sort((a, b) => {
//       if (sortOrder === 'asc') {
//         return a.price - b.price;
//       } else {
//         return b.price - a.price;
//       }
//     });
//   }, [sortOrder]);

// return (
//   <div className="p-8 max-w-4xl mx-auto">
//     <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b pb-6">
//       <div>
//         <h1 className="text-3xl font-bold text-gray-900">Products Inventory</h1>
//         <p className="text-gray-500 mt-1">Manage and sort your items by price</p>
//       </div>

//       {/* Reusable SortButton component */}
//       {/* <SortButton
//           direction={sortOrder}
//           onToggle={(newDir) => setSortOrder(newDir)}
//         /> */}
//     </header>

{/* Product List */ }
{/* <div className="grid gap-4">
        {sortedProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold">
                {product.name.charAt(0)}
              </div>
              <span className="font-semibold text-gray-800">{product.name}</span>
            </div>
            <div className="text-lg font-bold text-indigo-600">
              ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div> */}

{/* {sortedProducts.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          No products found in the database.
        </div>
      )}
    </div>
  );
} */}