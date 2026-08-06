import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterPanel } from './master-panel';

describe('MasterPanel', () => {
  let component: MasterPanel;
  let fixture: ComponentFixture<MasterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(MasterPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
