// 'use client';

// import React from 'react';

// /**
//  * SortDirection type defines the possible sort orders.
//  */
// export type SortDirection = 'asc' | 'desc';

// interface SortButtonProps {
//     /** The current sorting direction state from the parent */
//     direction: SortDirection;
//     /** Callback function to toggle the direction in the parent state */
//     onToggle: (newDirection: SortDirection) => void;
//     /** Optional label text for the button */
//     label?: string;
// }

// /**
//  * A reusable SortButton component that toggles between ascending and descending order.
//  */
// export function SortButton({ direction, onToggle, label = 'Sort by Price' }: SortButtonProps) {
//     const handleToggle = () => {
//         // Switch to the opposite direction
//         const nextDirection = direction === 'asc' ? 'desc' : 'asc';
//         onToggle(nextDirection);
//     };

//     return (
//         <button
//             onClick={handleToggle}
//             className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all shadow-sm active:scale-95"
//             aria-label={`Sort ${direction === 'asc' ? 'descending' : 'ascending'}`}
//         >
//             <span className="text-sm">{label}</span>
//             <span className="font-bold min-w-[120px] text-left">
//                 {direction === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
//             </span>
//         </button>
//     );
// }
