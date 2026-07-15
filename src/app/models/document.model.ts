export interface Document {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  project: {
    id: number;
    projectName: string;
  };
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
}
