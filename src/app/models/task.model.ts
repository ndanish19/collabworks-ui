export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: number;
  taskName: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;

  project: {
    id: number;
    projectName: string;
  };

  assignedUser: {
    id: number;
    name: string;
    email: string;
  };
}

export interface TaskFormPayload {
  taskName: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;

  project: {
    id: number;
  };

  assignedUser: {
    id: number;
  };
}

export const TASK_STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

export const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
