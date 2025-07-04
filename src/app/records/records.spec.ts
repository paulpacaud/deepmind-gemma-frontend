import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Records } from './records';

describe('Records', () => {
  let component: Records;
  let fixture: ComponentFixture<Records>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Records]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Records);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
