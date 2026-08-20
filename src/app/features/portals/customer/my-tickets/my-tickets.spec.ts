import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { MyTickets } from './my-tickets';

describe('MyTickets', () => {
  let component: MyTickets;
  let fixture: ComponentFixture<MyTickets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyTickets],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MyTickets);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

