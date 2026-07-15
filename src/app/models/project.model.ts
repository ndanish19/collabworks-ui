export interface Project {
  id: number;
  projectName: string;
  description: string;
  status: string;
  deadline: string;

  createdBy: ProjectUser;

  teamLead?: ProjectUser;

  employees: ProjectUser[];

  clients: ProjectUser[];

  users: ProjectUser[];
}

export interface ProjectUser {
  id: number;
  name: string;
  email: string;
}

export interface ProjectFormPayload {
  projectName: string;
  description: string;
  status: string;
  deadline: string;

  users: {
    id: number;
  }[];
}

export const PROJECT_STATUSES: string[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
