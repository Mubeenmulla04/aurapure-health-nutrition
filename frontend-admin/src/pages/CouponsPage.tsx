import React, { useState } from 'react';
import { Tag, Plus, CheckCircle2 } from 'lucide-react';

export const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState([
    {
      _id: '1',
      code: 'AURAPURE10',
      description: '10% Flat Discount on All Plant Nutrition Orders',
      discountType: 'PERCENT',
      discountValue: 10,
      minOrderValue: 999,
      maxDiscountCap: 500,
      timesUsed: 142,
      isActive: true,
    },
    {
      _id: '2',
      code: 'WELCOME200',
      description: 'Flat ₹200 OFF on your first wellness order above ₹1,499',
      discountType: 'FLAT',
      discountValue: 200,
      minOrderValue: 1499,
      timesUsed: 89,
      isActive: true,
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-admin-dark tracking-tight">Marketing & Promotional Coupons</h1>
          <p className="text-xs text-admin-muted mt-1">Manage promotional discount codes, caps & usage thresholds</p>
        </div>
      </div>

      <div className="admin-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                <th className="admin-table-th">Coupon Code</th>
                <th className="admin-table-th">Offer Description</th>
                <th className="admin-table-th">Discount Benefit</th>
                <th className="admin-table-th">Min Order Value</th>
                <th className="admin-table-th">Redemptions</th>
                <th className="admin-table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {coupons.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                  <td className="admin-table-td">
                    <span className="font-bold text-admin-dark text-sm bg-slate-100 px-2.5 py-1 rounded-md">
                      {c.code}
                    </span>
                  </td>
                  <td className="admin-table-td font-medium text-admin-dark">{c.description}</td>
                  <td className="admin-table-td font-bold text-emerald-700">
                    {c.discountType === 'PERCENT' ? `${c.discountValue}% OFF (Max ₹${c.maxDiscountCap})` : `₹${c.discountValue} FLAT OFF`}
                  </td>
                  <td className="admin-table-td font-medium text-admin-dark">₹{c.minOrderValue}</td>
                  <td className="admin-table-td text-admin-muted font-semibold">{c.timesUsed} times</td>
                  <td className="admin-table-td">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
