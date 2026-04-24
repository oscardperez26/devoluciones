import { create } from 'zustand';
import type { CarrierAddress, DraftItem } from '@/types';

export interface SelectedItem extends DraftItem {
  devolucionItemId?: string;
  requiresEvidence?: boolean;
  productName?: string;
}

interface WizardState {
  sessionToken: string | null;
  expiresAt: string | null;
  orderId: string | null;
  returnId: string | null;
  currentStep: number;
  selectedItems: SelectedItem[];
  deliveryMethod: 'TIENDA' | 'TRANSPORTADORA' | null;
  storeId: string | null;
  carrierAddress: CarrierAddress | null;
  refundMethod: string | null;
  ticketNumber: string | null;
  totalRefund: number;
  confirmationEmail: string | null;

  setSession: (token: string, expiresAt: string, orderId: string) => void;
  setReturnId: (id: string, items: SelectedItem[]) => void;
  setViewReturnId: (id: string) => void;
  setSelectedItems: (items: SelectedItem[]) => void;
  setDeliveryStore: (storeId: string) => void;
  setDeliveryCarrier: (address: CarrierAddress) => void;
  setRefundMethod: (method: string) => void;
  setConfirmation: (ticketNumber: string, totalRefund: number, confirmationEmail: string) => void;
  goToStep: (step: number) => void;
  resetReturn: () => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>((set) => ({
  sessionToken: null,
  expiresAt: null,
  orderId: null,
  returnId: null,
  currentStep: 1,
  selectedItems: [],
  deliveryMethod: null,
  storeId: null,
  carrierAddress: null,
  refundMethod: null,
  ticketNumber: null,
  totalRefund: 0,
  confirmationEmail: null,

  setSession: (token, expiresAt, orderId) =>
    set({ sessionToken: token, expiresAt, orderId, currentStep: 2 }),

  setReturnId: (id, items) => set({ returnId: id, selectedItems: items }),

  setViewReturnId: (id) => set({ returnId: id }),

  setSelectedItems: (items) => set({ selectedItems: items }),

  setDeliveryStore: (storeId) => set({ deliveryMethod: 'TIENDA', storeId, carrierAddress: null }),

  setDeliveryCarrier: (address) =>
    set({ deliveryMethod: 'TRANSPORTADORA', carrierAddress: address, storeId: null }),

  setRefundMethod: (method) => set({ refundMethod: method }),

  setConfirmation: (ticketNumber, totalRefund, confirmationEmail) =>
    set({ ticketNumber, totalRefund, confirmationEmail }),

  goToStep: (step) => set({ currentStep: step }),

  // Preserves the active session (sessionToken, expiresAt, orderId) but clears return data
  resetReturn: () =>
    set((state) => ({
      returnId: null,
      currentStep: 2,
      selectedItems: [],
      deliveryMethod: null,
      storeId: null,
      carrierAddress: null,
      refundMethod: null,
      ticketNumber: null,
      totalRefund: 0,
      confirmationEmail: null,
      sessionToken: state.sessionToken,
      expiresAt: state.expiresAt,
      orderId: state.orderId,
    })),

  reset: () =>
    set({
      sessionToken: null, expiresAt: null, orderId: null, returnId: null,
      currentStep: 1, selectedItems: [], deliveryMethod: null, storeId: null,
      carrierAddress: null, refundMethod: null, ticketNumber: null,
      totalRefund: 0, confirmationEmail: null,
    }),
}));
