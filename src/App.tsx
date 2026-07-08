import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeesList from './pages/EmployeesList';
import EmployeeDetails from './pages/EmployeeDetails';
import EmployeeDocuments from './pages/EmployeeDocuments';
import AbsencesList from './pages/AbsencesList';
import NewAbsence from './pages/NewAbsence';
import ValidateAbsences from './pages/ValidateAbsences';
import AbsenceTypesSettings from './pages/AbsenceTypesSettings';
import UsersRoles from './pages/UsersRoles';
import DocumentsGlobal from './pages/DocumentsGlobal';
import SitesPage from './pages/SitesPage';
import SoldesPage from './pages/SoldesPage';
import DocumentTypesSettings from './pages/DocumentTypesSettings';
import PlanningCalendar from './pages/PlanningCalendar';
import PlanningSemaine from './pages/PlanningSemaine';
import AteliersSettings from './pages/AteliersSettings';

// Placeholder components for routing
const Placeholder = ({ title }: { title: string }) => (
  <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 text-center text-slate-500 text-sm">
    {title} - (En cours de développement)
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/employees" element={<EmployeesList />} />
              <Route path="/employees/new" element={<EmployeeDetails />} />
              <Route path="/employees/:id" element={<EmployeeDetails />} />
              <Route path="/employees/:id/documents" element={<EmployeeDocuments />} />
              
              <Route path="/absences" element={<AbsencesList />} />
              <Route path="/absences/new" element={<NewAbsence />} />
              <Route path="/absences/validate" element={<ValidateAbsences />} />
              <Route path="/planning" element={<PlanningCalendar />} />
              <Route path="/planning-semaine" element={<PlanningSemaine />} />
              
              <Route path="/documents" element={<DocumentsGlobal />} />
              <Route path="/sites" element={<SitesPage />} />
              <Route path="/soldes" element={<SoldesPage />} />
              
              <Route path="/settings/document-types" element={<DocumentTypesSettings />} />
              <Route path="/settings/absence-types" element={<AbsenceTypesSettings />} />
              <Route path="/settings/ateliers" element={<AteliersSettings />} />
              <Route path="/settings/users-roles" element={<UsersRoles />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
