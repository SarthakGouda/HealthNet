import { Routes } from '@angular/router';
import { HomeComponent } from './components/home-component/home-component';
import { ComplianceComponent } from './components/compliance-component/compliance-component';
import { AboutComponent } from './components/about-component/about-component';
import { LoginComponent } from './components/login-component/login-component';
import { RegisterComponent } from './components/register-component/register-component';
import { OutbreakFormComponent } from './components/outbreak-component/outbreak-component';
import { OutbreakListComponent } from './components/outbreak-component/outbreak-list/outbreak-list';
import { OutbreakDashboardComponent } from './components/outbreak-component/outbreak-dashboard/outbreak-dashboard';
import { OutbreakUpdateComponent } from './components/outbreak-component/outbreak-update/outbreak-update';
import { OutbreakDetailComponent } from './components/outbreak-component/outbreak-detail/outbreak-detail';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';
import { ProfileComponent } from './components/profile-component/profile-component';
import { UpdateUserComponent } from './components/update-user-component/update-user-component';
import { DeleteUserComponent } from './components/delete-user-component/delete-user-component';
import { UsersComponent } from './components/users-component/users-component';
import { ForgotPasswordComponent } from './components/forgot-password-component/forgot-password-component';
import { Unauthorized } from './components/unauthorized/unauthorized';
import { SymptomHistoryComponent } from './components/symptomhistory-component/symptomhistory-component';
import { SymptomReportComponent } from './components/symptomreport-component/symptomreport-component';
import { CitizenhomeComponent } from './components/citizenhome-component/citizenhome-component';
import { LabTestComponent } from './components/lab-test-component/lab-test-component';
import { LabTestDetailComponent } from './components/lab-test-detail-component/lab-test-detail-component';
import { LabTestCreateComponent } from './components/lab-test-create-component/lab-test-create-component';
import { LabTestEditComponent } from './components/lab-test-edit-component/lab-test-edit-component';
import { LabReportUploadComponent } from './components/lab-report-upload-component/lab-report-upload-component';
import { LabTechAssignmentsComponent } from './components/lab-tech-assignments-component/lab-tech-assignments-component';
import { PatientsComponent } from './components/patients-component/patients-component';
import { CasesComponent } from './components/cases-component/cases-component';
import { MedicalRecordsComponent } from './components/medical-records-component/medical-records-component';
import { AllSymptomReportsComponent } from './components/all-symptom-reports-component/all-symptom-reports-component';
import { ComplianceRecordComponent } from './components/compliance-record-component/compliance-record-component';
import { AuditComponent } from './components/audit-component/audit-component';
import { AnalyticsComponent } from './components/analytics-component/analytics-component';
import { AdminDashboardComponent } from './components/admin-dashboard-component/admin-dashboard-component';
import { DashboardHomeComponent } from './components/dashboard-home-component/dashboard-home-component';
import { EpidemiologyComponent } from './components/epidemiology-component/epidemiology-component';

const OUTBREAK_ROLES = ['Admin', 'Doctor', 'Public Health Officer'];
const DOCTOR_ADMIN = ['Doctor', 'Admin'];
const LAB_TECH = ['Lab Technician'];
const ALL_STAFF = ['Doctor', 'Admin', 'Public Health Officer', 'Lab Technician', 'Researcher', 'Compliance Officer'];

export const routes: Routes = [
  // Public landing — anyone can see this
  { path: '',                 component: HomeComponent, pathMatch: 'full' },

  // Public
  { path: 'login',            component: LoginComponent },
  { path: 'register',         component: RegisterComponent },
  { path: 'forgot-password',  component: ForgotPasswordComponent },
  { path: 'about',            component: AboutComponent },
  { path: 'compliance',       component: ComplianceComponent },
  { path: 'unauthorized',     component: Unauthorized },

  // Authenticated
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },

  // Citizen
  { path: 'citizen-home',     component: CitizenhomeComponent,     canActivate: [authGuard, roleGuard], data: { roles: ['Citizen'] } },
  { path: 'symptom-report',   component: SymptomReportComponent,   canActivate: [authGuard, roleGuard], data: { roles: ['Citizen'] } },
  { path: 'symptom-history',  component: SymptomHistoryComponent,  canActivate: [authGuard, roleGuard], data: { roles: ['Citizen'] } },

  // Staff dashboards
  { path: 'home',             component: DashboardHomeComponent,   canActivate: [authGuard, roleGuard], data: { roles: ALL_STAFF } },
  { path: 'home/admin',       component: AdminDashboardComponent,  canActivate: [authGuard, roleGuard], data: { roles: ['Admin'] } },

  // Clinical
  { path: 'patients',         component: PatientsComponent,         canActivate: [authGuard, roleGuard], data: { roles: ['Admin', 'Doctor', 'Public Health Officer', 'Lab Technician'] } },
  { path: 'cases',            component: CasesComponent,            canActivate: [authGuard, roleGuard], data: { roles: ['Doctor', 'Public Health Officer', 'Admin'] } },
  { path: 'medical-records',  component: MedicalRecordsComponent,   canActivate: [authGuard, roleGuard], data: { roles: DOCTOR_ADMIN } },
  { path: 'all-symptom-reports', component: AllSymptomReportsComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Doctor', 'Researcher', 'Admin', 'Public Health Officer'] } },

  // Lab
  { path: 'lab-tests',                       component: LabTestComponent,            canActivate: [authGuard, roleGuard], data: { roles: ['Doctor', 'Lab Technician', 'Researcher', 'Admin', 'Compliance Officer'] } },
  { path: 'lab-tests/create',                component: LabTestCreateComponent,      canActivate: [authGuard, roleGuard], data: { roles: ['Doctor', 'Lab Technician'] } },
  { path: 'lab-tests/upload-report',         component: LabReportUploadComponent,    canActivate: [authGuard, roleGuard], data: { roles: LAB_TECH } },
  { path: 'lab-tests/my-assignments',        component: LabTechAssignmentsComponent, canActivate: [authGuard, roleGuard], data: { roles: LAB_TECH } },
  { path: 'lab-tests/:id',                   component: LabTestDetailComponent,      canActivate: [authGuard, roleGuard], data: { roles: ['Doctor', 'Lab Technician', 'Researcher', 'Admin', 'Compliance Officer'] } },
  { path: 'lab-tests/:id/edit',              component: LabTestEditComponent,        canActivate: [authGuard, roleGuard], data: { roles: ['Doctor', 'Lab Technician'] } },

  // Outbreak + Epidemiology
  { path: 'outbreaks',          component: OutbreakDashboardComponent, canActivate: [authGuard, roleGuard], data: { roles: OUTBREAK_ROLES } },
  { path: 'outbreaks/list',     component: OutbreakListComponent,      canActivate: [authGuard, roleGuard], data: { roles: OUTBREAK_ROLES } },
  { path: 'outbreaks/new',      component: OutbreakFormComponent,      canActivate: [authGuard, roleGuard], data: { roles: ['Admin', 'Public Health Officer'] } },
  { path: 'outbreaks/:id/edit', component: OutbreakUpdateComponent,    canActivate: [authGuard, roleGuard], data: { roles: ['Admin', 'Public Health Officer'] } },
  { path: 'outbreaks/:id',      component: OutbreakDetailComponent,    canActivate: [authGuard, roleGuard], data: { roles: OUTBREAK_ROLES } },
  { path: 'epidemiology',       component: EpidemiologyComponent,      canActivate: [authGuard, roleGuard], data: { roles: OUTBREAK_ROLES } },

  // Compliance & Audit
  { path: 'compliance-records',     component: ComplianceRecordComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Compliance Officer', 'Admin'] } },
  { path: 'compliance-records/new', component: ComplianceRecordComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Compliance Officer', 'Admin'] } },
  { path: 'audit',                  component: AuditComponent,            canActivate: [authGuard, roleGuard], data: { roles: ['Compliance Officer', 'Public Health Officer', 'Admin'] } },

  // Analytics — every authenticated user (Citizens see public outbreak/epi trends only)
  { path: 'analytics', component: AnalyticsComponent, canActivate: [authGuard] },

  // Admin user management
  { path: 'users',  component: UsersComponent,      canActivate: [authGuard, roleGuard], data: { roles: ['Admin'] } },
  { path: 'update', component: UpdateUserComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Admin'] } },
  { path: 'delete', component: DeleteUserComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Admin'] } },

  // Catch-all
  { path: '**', redirectTo: '' },
];
