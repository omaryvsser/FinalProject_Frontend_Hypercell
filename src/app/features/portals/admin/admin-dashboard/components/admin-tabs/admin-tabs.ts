import { Component, input, output } from '@angular/core';
import { TabType } from '../../admin-dashboard';

@Component({
  selector: 'app-admin-tabs',
  standalone: true,
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
