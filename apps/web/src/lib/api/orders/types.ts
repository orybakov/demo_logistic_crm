export enum OrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  INVOICED = 'invoiced',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'Черновик',
  [OrderStatus.CONFIRMED]: 'Подтвержден',
  [OrderStatus.INVOICED]: 'Выставлен счет',
  [OrderStatus.PARTIALLY_PAID]: 'Частично оплачен',
  [OrderStatus.PAID]: 'Оплачен',
  [OrderStatus.CANCELLED]: 'Отменен',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.UNPAID]: 'Не оплачен',
  [PaymentStatus.PARTIALLY_PAID]: 'Частично оплачен',
  [PaymentStatus.PAID]: 'Оплачен',
};

export interface Client {
  id: string;
  name: string;
  inn?: string;
}

export interface Filial {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface OrderItem {
  id: string;
  description: string;
  quantity?: number;
  unit?: string;
  pricePerUnit: number;
  total: number;
  vatRate?: number;
  notes?: string;
}

export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  documentNumber?: string;
  documentUrl?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export interface OrderRequest {
  id: string;
  number: string;
  status: string;
  createdAt: string;
  _count?: {
    trips: number;
  };
}

export interface Order {
  id: string;
  number: string;
  clientId: string;
  client?: Client;
  contractId?: string;
  contract?: any;
  orderDate: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentType?: string;
  paymentDeadline?: string;
  status: OrderStatus;
  notes?: string;
  filialId?: string;
  filial?: Filial;
  assignedToId?: string;
  assignedTo?: User;
  createdById: string;
  createdBy?: User;
  items: OrderItem[];
  payments: Payment[];
  requests: OrderRequest[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    items: number;
    payments: number;
    requests: number;
  };
}

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
  clientId?: string;
  filialId?: string;
  assignedToId?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderStats {
  total: number;
  byStatus: Record<string, number>;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

export interface CreateOrderDto {
  clientId: string;
  contractId?: string;
  orderDate?: string;
  subtotal: number;
  vatRate?: number;
  vatAmount?: number;
  total?: number;
  paymentStatus?: PaymentStatus;
  paymentType?: string;
  paymentDeadline?: string;
  notes?: string;
  filialId?: string;
  assignedToId?: string;
  items?: Array<{
    description: string;
    quantity?: number;
    unit?: string;
    pricePerUnit: number;
    total?: number;
    vatRate?: number;
    notes?: string;
  }>;
}

export interface UpdateOrderDto {
  contractId?: string;
  orderDate?: string;
  subtotal?: number;
  vatRate?: number;
  vatAmount?: number;
  total?: number;
  paidAmount?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentType?: string;
  paymentDeadline?: string;
  notes?: string;
  filialId?: string;
  assignedToId?: string;
}

export interface ChangeStatusDto {
  status: OrderStatus;
  comment?: string;
}

export interface AddPaymentDto {
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  documentNumber?: string;
  documentUrl?: string;
  notes?: string;
}
