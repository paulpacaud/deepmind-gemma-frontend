import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegacyDmp } from './legacy-dmp';

describe('LegacyDmp', () => {
  let component: LegacyDmp;
  let fixture: ComponentFixture<LegacyDmp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegacyDmp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LegacyDmp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});