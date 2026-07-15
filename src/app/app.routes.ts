import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Users } from './pages/users/users';
import { Projects } from './pages/projects/projects';
import { authGuard } from './auth.guard';
import { ProjectDetail } from './pages/project-detail /project-detail';
import { FilesList } from './pages/files/files-list';
import { ProjectFiles } from './pages/project-files/project-files';

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
    ],
  },
];
