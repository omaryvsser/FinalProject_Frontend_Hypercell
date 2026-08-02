import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Discover } from './features/public/discover/discover'
import { MyTickets } from './features/portals/customer/my-tickets/my-tickets';

export const routes: Routes = [
    {
        path:'',
        component: Discover,
    },
    {
        path: 'login',
        component: Login,
    },
    {
        path: 'my-tickets',
        component: MyTickets,
    },
];
