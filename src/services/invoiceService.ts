import { apiClient } from "./apiClient";
import type { CreateInvoicePayload, Invoice } from "../types/invoice";

const INVOICES_ENDPOINT = "/invoices";

const sortInvoicesByLatest = (invoices: Invoice[]): Invoice[] => {
  return [...invoices].sort(
    (firstInvoice, secondInvoice) =>
      new Date(secondInvoice.invoiceDate).getTime() -
      new Date(firstInvoice.invoiceDate).getTime()
  );
};

const generateInvoiceDbId = (): string => {
  return `invoice-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

export const invoiceService = {
  getInvoices: async (): Promise<Invoice[]> => {
    const invoices = await apiClient.get<Invoice[]>(INVOICES_ENDPOINT);

    return sortInvoicesByLatest(invoices);
  },

  getInvoicesByUserId: async (userId: string): Promise<Invoice[]> => {
    const invoices = await apiClient.get<Invoice[]>(
      `${INVOICES_ENDPOINT}?userId=${encodeURIComponent(userId)}`
    );

    return sortInvoicesByLatest(invoices);
  },

  getInvoiceByOrderId: async (orderId: string): Promise<Invoice | null> => {
    const invoices = await apiClient.get<Invoice[]>(
      `${INVOICES_ENDPOINT}?orderId=${encodeURIComponent(orderId)}`
    );

    return invoices[0] ?? null;
  },

  getInvoiceByInvoiceNumber: async (
    invoiceNumber: string
  ): Promise<Invoice | null> => {
    const invoices = await apiClient.get<Invoice[]>(
      `${INVOICES_ENDPOINT}?invoiceNumber=${encodeURIComponent(invoiceNumber)}`
    );

    return invoices[0] ?? null;
  },

  createInvoice: async (
    payload: CreateInvoicePayload
  ): Promise<Invoice> => {
    const now = new Date().toISOString();

    const invoice: Invoice = {
      ...payload,
      id: generateInvoiceDbId(),
      createdAt: now,
      updatedAt: now
    };

    return apiClient.post<Invoice, Invoice>(INVOICES_ENDPOINT, invoice);
  }
};