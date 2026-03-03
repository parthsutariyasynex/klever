"use client";

import { memo } from "react";
import { Summary } from "@/types/product";

function SummaryCards({ totalProducts, averagePrice, averageCost, totalBrands }: Summary) {
    const cards = [
        {
            label: "Total Products",
            value: totalProducts.toLocaleString(),
            icon: (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            gradient: "card-gradient--blue",
        },
        {
            label: "Average Price",
            value: `$${averagePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            icon: (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            gradient: "card-gradient--green",
        },
        {
            label: "Average Cost",
            value: `$${averageCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            icon: (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
            ),
            gradient: "card-gradient--purple",
        },
        {
            label: "Total Brands",
            value: totalBrands.toLocaleString(),
            icon: (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
            ),
            gradient: "card-gradient--orange",
        },
    ];

    // return (
    //     <div className="summary-grid">
    //         {cards.map((card) => (
    //             <div key={card.label} className={`summary-card ${card.gradient}`}>
    //                 <div className="summary-card__icon">{card.icon}</div>
    //                 <div className="summary-card__content">
    //                     <div className="summary-card__label">{card.label}</div>
    //                     <div className="summary-card__value">{card.value}</div>
    //                 </div>
    //             </div>
    //         ))}
    //     </div>
    // );
}

// export default memo(SummaryCards);
