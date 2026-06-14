import { Routes } from '@angular/router';
import { CraftsmanRegisterComponent } from './register/craftsman-register.component';
import { CraftsmanProfileComponent } from './profile/craftsman-profile.component';
import { CraftsmanSearchComponent } from './search/craftsman-search.component';

export const craftsmanRoutes: Routes = [
  { path: '', component: CraftsmanSearchComponent },
  { path: 'register', component: CraftsmanRegisterComponent },
  { path: 'profile/:id', component: CraftsmanProfileComponent } // المسار الجديد
];