import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type OrganizerTabType = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'COMPLETED';

@Component({
  selector: 'app-organizer-tabs',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './organizer-tabs.html',
  styleUrl: './organizer-tabs.css'
})
export class OrganizerTabsComponent {
  activeTab = input<OrganizerTabType>('ALL');
  allCount = input<number>(0);
  publishedCount = input<number>(0);
  draftCount = input<number>(0);
  completedCount = input<number>(0);

  tabChange = output<OrganizerTabType>();
  addClick = output<void>();

  onTabSelect(tab: OrganizerTabType) {
    this.tabChange.emit(tab);
  }

  onAdd() {
    this.addClick.emit();
  }
}
