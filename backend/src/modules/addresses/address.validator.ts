import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
  houseFlatNo: z.string().optional(),
  apartmentBuilding: z.string().optional(),
  streetArea: z.string().optional(),
  addressLine1: z.string().min(3, 'Flat/House no., Building, Street is required'),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit Indian PIN code'),
  country: z.string().default('India').optional(),
  isDefaultShipping: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional(),
});
