import { Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  templateUrl: './admin-header.html',
  styleUrl: './admin-header.css'
})
export class AdminHeaderComponent {
  currentUserEmail = input<string>('');
}
