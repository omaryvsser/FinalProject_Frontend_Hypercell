import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { EventEditor } from './event-editor';

describe('EventEditor', () => {
  let component: EventEditor;

  beforeEach(() => {
    component = new EventEditor();
  });

  it('should create event editor component', () => {
    expect(component).toBeTruthy();
  });
});
