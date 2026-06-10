import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { SideNavComponent } from '../../components/side-nav/side-nav.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, SideNavComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {}