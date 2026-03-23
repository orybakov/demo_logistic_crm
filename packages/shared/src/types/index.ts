export enum RoleCode {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  DISPATCHER = 'DISPATCHER',
  SALES = 'SALES',
  OPERATOR = 'OPERATOR',
  DRIVER = 'DRIVER',
  CLIENT = 'CLIENT',
}

export enum PermissionSubject {
  REQUESTS = 'requests',
  ORDERS = 'orders',
  TRIPS = 'trips',
  CLIENTS = 'clients',
  VEHICLES = 'vehicles',
  DRIVERS = 'drivers',
  REPORTS = 'reports',
  USERS = 'users',
  ADMIN = 'admin',
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
}

export enum RequestStatus {
  NEW = 'new',
  CALCULATING = 'calculating',
  CALCULATED = 'calculated',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RequestPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TripStatus {
  SCHEDULED = 'scheduled',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum OrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  NOT_PAID = 'not_paid',
  PARTIAL = 'partial',
  PAID = 'paid',
}

export enum VehicleStatus {
  AVAILABLE = 'available',
  ON_TRIP = 'on_trip',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}

export enum DriverStatus {
  AVAILABLE = 'available',
  ON_TRIP = 'on_trip',
  OFF_DUTY = 'off_duty',
  INACTIVE = 'inactive',
}

export enum PointType {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
  WAREHOUSE = 'warehouse',
  BORDER = 'border',
  OTHER = 'other',
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string | Record<string, string>;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  avatarUrl?: string;
  filialId?: string;
  isActive: boolean;
  isSuperadmin: boolean;
  roles: RoleCode[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  permissions: Array<{
    subject: PermissionSubject;
    action: PermissionAction;
  }>;
}

export interface Filial {
  id: string;
  name: string;
  shortName?: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isHead: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  type: string;
  name: string;
  inn: string;
  kpp?: string;
  ogrn?: string;
  legalAddress?: string;
  postalAddress?: string;
  phone?: string;
  email?: string;
  website?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  clientGroup?: string;
  creditLimit?: number;
  paymentDays?: number;
  filialId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model?: string;
  year?: number;
  bodyType: string;
  capacityKg: number;
  capacityM3?: number;
  status: VehicleStatus;
  filialId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpires: string;
  status: DriverStatus;
  rating?: number;
  filialId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Request {
  id: string;
  number: string;
  clientId: string;
  client?: Client;
  orderId?: string;
  type: string;
  totalWeight?: number;
  totalVolume?: number;
  totalPieces?: number;
  status: RequestStatus;
  priority: RequestPriority;
  notes?: string;
  estimatedPrice?: number;
  filialId?: string;
  assignedToId?: string;
  assignedTo?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  createdById: string;
  createdBy?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  points?: Point[];
  cargoItems?: CargoItem[];
  trips?: Trip[];
  createdAt: string;
  updatedAt: string;
}

export interface Point {
  id: string;
  requestId: string;
  type: PointType;
  sequence: number;
  address: string;
  city?: string;
  region?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  plannedDate?: string;
  plannedTimeFrom?: string;
  plannedTimeTo?: string;
  actualArrival?: string;
  actualDeparture?: string;
  instructions?: string;
}

export interface CargoItem {
  id: string;
  requestId: string;
  description?: string;
  weight?: number;
  volume?: number;
  length?: number;
  width?: number;
  height?: number;
  pieces?: number;
  packageType?: string;
  isDangerous: boolean;
  adrClass?: string;
  isFragile: boolean;
  temperatureRequired: boolean;
}

export interface Trip {
  id: string;
  number: string;
  requestId: string;
  request?: Request;
  vehicleId?: string;
  vehicle?: Vehicle;
  driverId?: string;
  driver?: Driver;
  status: TripStatus;
  plannedStart?: string;
  actualStart?: string;
  plannedEnd?: string;
  actualEnd?: string;
  plannedDistance?: number;
  actualDistance?: number;
  plannedDuration?: number;
  actualDuration?: number;
  plannedFuel?: number;
  actualFuel?: number;
  delayMinutes?: number;
  delayReason?: string;
  cancellationReason?: string;
  notes?: string;
  checkpoints?: Checkpoint[];
  createdAt: string;
  updatedAt: string;
}

export interface Checkpoint {
  id: string;
  tripId: string;
  pointId?: string;
  type: string;
  sequence: number;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  plannedTime?: string;
  actualTime?: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  photoUrl?: string;
  signatureUrl?: string;
}

export interface Order {
  id: string;
  number: string;
  clientId: string;
  client?: Client;
  contractId?: string;
  orderDate: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentType?: string;
  paymentDeadline?: string;
  notes?: string;
  status: OrderStatus;
  filialId?: string;
  assignedToId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
