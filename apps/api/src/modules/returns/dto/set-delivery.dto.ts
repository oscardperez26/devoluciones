import { z } from 'zod';

const CarrierAddressSchema = z.object({
  fullName: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  department: z.string().min(1),
  phone: z.string().min(7).max(20),
  documentId: z.string().min(5).max(20),
});

export const SetDeliverySchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('TIENDA'),
    storeId: z.string().uuid(),
  }),
  z.object({
    method: z.literal('TRANSPORTADORA'),
    address: CarrierAddressSchema,
  }),
]);

export type SetDeliveryDto = z.infer<typeof SetDeliverySchema>;
