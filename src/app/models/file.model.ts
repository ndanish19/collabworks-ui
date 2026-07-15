export interface FileItem {
  id: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  project: {
    id: number;
    projectName: string;
  };
  uploadedBy: {
    id: number;
    name: string;
    email: string;
  };
}
