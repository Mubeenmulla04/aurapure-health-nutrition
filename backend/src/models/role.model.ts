import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: 'customer' | 'admin' | 'inventory_manager' | 'support';
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
      enum: ['customer', 'admin', 'inventory_manager', 'support'],
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
