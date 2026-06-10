import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabTestCreateComponent } from './lab-test-create-component';

describe('LabTestCreateComponent', () => {
  let component: LabTestCreateComponent;
  let fixture: ComponentFixture<LabTestCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabTestCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabTestCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
