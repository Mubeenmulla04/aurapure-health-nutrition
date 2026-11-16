import mongoose, { Document, Schema } from 'mongoose';

export type RoleType =
  | 'super_admin'
  | 'admin'
  | 'order_manager'
  | 'product_manager'
  | 'inventory_manager'
  | 'support_manager'
  | 'marketing_manager'
  | 'customer';

export interface IRole extends Document {
  name: RoleType;
  description: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'super_admin',
        'admin',
        'order_manager',
        'product_manager',
        'inventory_manager',
        'support_manager',
        'marketing_manager',
        'customer',
      ],
    },
    description: {
      type: String,
      default: '',
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export const Role = mongoose.model<IRole>('Role', RoleSchema);
