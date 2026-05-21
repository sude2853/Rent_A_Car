import { Route } from '@angular/router';

export const appRoutes: Route[] = [
    {
        path: '',
        loadComponent:() => import('./pages/layout/layout'),
        children: [
            {
                path: '',
                loadComponent:() => import('./pages/home/home')
            },
            {
                path: 'login',
                loadComponent:() => import('./pages/login/login')
            },
            {
                path: 'register',
                loadComponent:() => import('./pages/register/register')
            },
            {
                path: 'reservations',
                loadComponent:() => import('./pages/reservations/reservations')
            },
            {
                path: 'profile',
                loadComponent:() => import('./pages/profile/profile')
            },
            {
                path: 'contact',
                loadComponent:() => import('./pages/contact/contact')
            }
        ]
    }
];
