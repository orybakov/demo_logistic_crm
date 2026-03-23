export interface DashboardStats {
  requestsToday: number;
  tripsActive: number;
  ordersPending: number;
  revenueToday: number;
}

export interface FreeRequest {
  id: string;
  number: string;
  clientName: string;
  status: string;
  priority: string;
  pickupCity?: string | null;
  deliveryCity?: string | null;
  createdAt: string;
}

export interface FreeRequestsWidget {
  total: number;
  requests: FreeRequest[];
}

export interface ProblemFlagRequest {
  id: string;
  number: string;
  clientName: string;
  flags: string[];
  status: string;
  priority: string;
}

export interface ProblemFlagsWidget {
  byFlag: Record<string, number>;
  requests: ProblemFlagRequest[];
}

export interface ProblemOrder {
  id: string;
  number: string;
  clientName: string;
  total: number;
  status: string;
  paymentStatus: string;
  overdueDays?: number;
}

export interface ProblemOrdersWidget {
  byStatus: Record<string, number>;
  orders: ProblemOrder[];
}

export interface TodayCheckpoint {
  id: string;
  requestNumber: string;
  address: string | null;
  city?: string | null;
  plannedTime?: string | null;
  vehiclePlate?: string | null;
  driverName?: string | null;
  status: string;
}

export interface TodayOperationsWidget {
  date: string;
  loadings: TodayCheckpoint[];
  deliveries: TodayCheckpoint[];
  stats: {
    totalLoadings: number;
    completedLoadings: number;
    totalDeliveries: number;
    completedDeliveries: number;
  };
}

export interface PendingPaymentOrder {
  id: string;
  number: string;
  clientName: string;
  total: number;
  paidAmount: number;
  paymentDeadline?: string | null;
  overdueDays?: number;
}

export interface PendingPaymentsWidget {
  total: number;
  totalAmount: number;
  orders: PendingPaymentOrder[];
}

export interface DashboardResult {
  blocks: {
    stats?: DashboardStats;
    freeRequests?: FreeRequestsWidget;
    problemFlags?: ProblemFlagsWidget;
    problemOrders?: ProblemOrdersWidget;
    todayOperations?: TodayOperationsWidget;
    pendingPayments?: PendingPaymentsWidget;
  };
  timestamp: string;
}

export interface QuickSearchResult {
  type: 'request' | 'order' | 'trip';
  id: string;
  number: string;
  status: string;
  clientName?: string;
  total?: number;
}

export interface DashboardBlock {
  id: string;
  label: string;
  defaultVisible: boolean;
}

export const flagLabels: Record<string, string> = {
  urgent: 'Срочная',
  oversize: 'Негабарит',
  fragile: 'Хрупкий',
  temp: 'Температурный',
  hazmat: 'Опасный',
  express: 'Экспресс',
};

export const flagColors: Record<string, string> = {
  urgent: 'bg-red-500/10 text-red-600',
  oversize: 'bg-yellow-500/10 text-yellow-600',
  fragile: 'bg-blue-500/10 text-blue-600',
  temp: 'bg-blue-500/10 text-blue-600',
  hazmat: 'bg-red-500/10 text-red-600',
  express: 'bg-orange-500/10 text-orange-600',
};

export const paymentStatusLabels: Record<string, string> = {
  not_paid: 'Не оплачен',
  partially_paid: 'Частично оплачен',
  paid: 'Оплачен',
};

export const requestStatusLabels: Record<string, string> = {
  new: 'Новая',
  confirmed: 'Подтверждена',
  in_progress: 'В работе',
  completed: 'Завершена',
  cancelled: 'Отменена',
  on_hold: 'На паузе',
};

export const orderStatusLabels: Record<string, string> = {
  draft: 'Черновик',
  confirmed: 'Подтвержден',
  invoiced: 'Выставлен счет',
  partially_paid: 'Частично оплачен',
  paid: 'Оплачен',
  cancelled: 'Отменен',
};
