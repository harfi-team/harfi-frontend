import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-craftsman-pending',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './craftsman-pending.component.html',
  styleUrls: ['./craftsman-pending.component.css'],
})
export class CraftsmanPendingComponent {
  craftsmanData: any;

  constructor(private router: Router) {
    this.craftsmanData = this.router.getCurrentNavigation()?.extras.state?.['craftsmanData'] ?? null;
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
