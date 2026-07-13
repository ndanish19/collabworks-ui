export interface Role {
  id: number;
  roleName: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  role: Role;
}

export interface UserFormPayload {
  name: string;
  email: string;
  password: string;
  role: {
    id: number;
  };
}

export const ROLES: Role[] = [
  { id: 1, roleName: 'ADMIN' },
  { id: 2, roleName: 'MANAGER' },
  { id: 3, roleName: 'TEAM_LEAD' },
  { id: 4, roleName: 'EMPLOYEE' },
  { id: 5, roleName: 'CLIENT' },
];
