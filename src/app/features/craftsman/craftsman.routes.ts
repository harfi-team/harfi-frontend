import { Routes } from '@angular/router';
import { CraftsmanRegisterComponent } from './register/craftsman-register.component';
import { CraftsmanSearchComponent } from './search/craftsman-search.component';
import { CraftsmanProfileComponent } from './profile/craftsman-profile.component';
export const craftsmanRoutes: Routes = [
  { path: 'register', component: CraftsmanRegisterComponent },
  { path: 'search', component: CraftsmanSearchComponent },
   // ✅ مسار البروفايل الجديد — يستقبل ID من الـ URL
   { path: 'profile/:id', component: CraftsmanProfileComponent } // المسار الجديد

];
