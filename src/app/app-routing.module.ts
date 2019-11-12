import { HomeComponent } from './home.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AuthGuardService } from './guards/auth-guard';
import { RegisterComponent } from './components/register/register.component';
import { SliderComponent } from './components/home/slider/slider.component';
import { SettingsComponent } from './components/home/settings/settings.component';
import { DebugComponent } from './components/home/debug/debug.component';

const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        canActivate: [AuthGuardService],
        children:
        [
            {
                path: '',
                component: SliderComponent
            },
            {
                path: 'settings',
                component: SettingsComponent,
                pathMatch: 'full'
            },
            {
                path: 'debug',
                component: DebugComponent,
                pathMatch: 'full'
            }
        ]
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'register',
        component: RegisterComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {useHash: true})],
    exports: [RouterModule]
})
export class AppRoutingModule { }
