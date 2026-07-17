import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Users } from './pages/users/users';
import { Projects } from './pages/projects/projects';
import { authGuard } from './auth.guard';
import { ProjectDetail } from './pages/project-detail /project-detail';
import { FilesList } from './pages/files/files-list';
import { ProjectFiles } from './pages/project-files/project-files';
import { ChatList } from './pages/chat/chat-list';
import { PrivateChat } from './pages/chat/private-chat';
import { ProjectChat } from './pages/chat/project-chat';
import { DocumentsList } from './pages/documents/documents-list';
import { ProjectDocuments } from './pages/documents/project-documents';
import { DocumentViewer } from './pages/documents/document-viewer';
import { MyProfile } from './pages/profile/my-profile';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: 'users', component: Users },
      { path: 'projects', component: Projects },
      { path: 'projects/:id', component: ProjectDetail },
      { path: 'files', component: FilesList },
      { path: 'files/:projectId', component: ProjectFiles },
      { path: 'chat', component: ChatList },
      { path: 'chat/private/:userId', component: PrivateChat },
      { path: 'chat/project/:projectId', component: ProjectChat },
      { path: 'documents', component: DocumentsList },
      { path: 'documents/:projectId', component: ProjectDocuments },
      { path: 'document/:id', component: DocumentViewer },
      { path: 'profile', component: MyProfile },
    ],
  },
];
