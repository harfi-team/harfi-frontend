import { Routes } from '@angular/router';
import { CraftsmanRegisterComponent } from './register/craftsman-register.component';
import { CraftsmanSearchComponent } from './search/craftsman-search.component';

export const craftsmanRoutes: Routes = [
  { path: 'register', component: CraftsmanRegisterComponent },
  { path: 'search', component: CraftsmanSearchComponent },

  // وممكن بعدين تضيفي مسارات تانية هنا زي السيرش أو البروفايل
];