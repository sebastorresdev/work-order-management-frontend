export enum WorkOrderType {
  Instalacion = 1,
  Averia = 2,
  Encomienda = 3
}

export enum WorkOrderStatus {
  Pendiente = 1,
  Observado = 2,
  Agendado = 3,
  Completado = 4,
  Rechazado = 5,
  Cancelado = 6
}

export enum WorkOrderPriority {
  Baja = 1,
  Media = 2,
  Alta = 3,
  Urgente = 4
}

export interface WorkOrder {
  id: string;
  ticketNumber: string;
  requestType: WorkOrderType;
  requestTypeName: string;
  status: WorkOrderStatus;
  statusName: string;
  priority: WorkOrderPriority;
  priorityName: string;
  branchId: string;
  branchName: string;
  createdByUserId: string;
  createdByUserName: string;
  clientCode: string;
  clientName: string;
  clientPhone: string;
  district: string;
  address: string;
  description: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  created: string;
  completedAt?: string;
}

export interface WorkOrderStatusHistory {
  id: string;
  statusFrom: WorkOrderStatus;
  statusFromName: string;
  statusTo: WorkOrderStatus;
  statusToName: string;
  comments?: string;
  changedByUserId: string;
  changedByUserName: string;
  timestamp: string;
}

export interface WorkOrderScheduleHistory {
  id: string;
  scheduledDate: string;
  scheduledSlot: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  notes?: string;
  scheduledByUserId: string;
  scheduledByUserName: string;
  scheduledAt: string;
}

export interface WorkOrderDetail extends WorkOrder {
  clientSecondaryPhone?: string;
  addressReference?: string;
  completionNotes?: string;
  observationNotes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  statusHistory: WorkOrderStatusHistory[];
  scheduleHistory: WorkOrderScheduleHistory[];
}

export interface CreateWorkOrderPayload {
  requestType: WorkOrderType;
  priority: WorkOrderPriority;
  branchId: string;
  clientCode: string;
  clientName: string;
  clientPhone: string;
  clientSecondaryPhone?: string;
  district: string;
  address: string;
  addressReference?: string;
  description: string;
}

export interface ScheduleWorkOrderPayload {
  scheduledDate: string;
  scheduledSlot: string;
  assignedTechnicianId?: string;
  notes?: string;
}

export interface ReasonPayload {
  reason: string;
}

export interface CompleteWorkOrderPayload {
  completionNotes?: string;
}
