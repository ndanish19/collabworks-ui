export interface Project {
  id: number;
  projectName: string;
  description: string;
  status: string;
  deadline: string;
  users: ProjectUser[];
}

export interface ProjectUser {
  id: number;
  name: string;
  email: string;
}
