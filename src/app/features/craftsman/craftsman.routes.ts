import { Routes } from '@angular/router';
import { CraftsmanRegisterComponent } from './register/craftsman-register.component';
import { CraftsmanProfileComponent } from './profile/craftsman-profile.component';

export const craftsmanRoutes: Routes = [
  { path: 'register', component: CraftsmanRegisterComponent },
  { path: 'profile/:id', component: CraftsmanProfileComponent } // المسار الجديد
];