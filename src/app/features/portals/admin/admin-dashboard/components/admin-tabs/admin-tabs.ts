import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TabType } from '../../admin-dashboard';

@Component({
  selector: 'app-admin-tabs',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './admin-tabs.html',
  styleUrl: './admin-tabs.css'
})
export class AdminTabsComponent {
  activeTab = input<TabType>('USERS');
  usersCount = input<number>(0);
  organizersCount = input<number>(0);
  venuesCount = input<number>(0);
  moviesCount = input<number>(0);
  singularTabLabel = input<string>('User');

  tabChange = output<TabType>();
  addClick = output<void>();

  onTabSelect(tab: TabType) {
    this.tabChange.emit(tab);
  }

  onAdd() {
    this.addClick.emit();
  }
}
