import { Toaster } from 'react-hot-toast';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AdminLayout, Layout } from './components/Layout';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import FoodDiary from './pages/FoodDiary';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Pricing from './pages/Pricing';
import PricingSuccess from './pages/PricingSuccess';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';
import ExerciseManagement from './pages/admin/ExerciseManagement';
import MealManagement from './pages/admin/MealManagement';
import PlanManagement from './pages/admin/PlanManagement';
import UsersManagement from './pages/admin/UsersManagement';
import WeeklyPlanManagement from './pages/admin/WeeklyPlanManagement';
import ExerciseLibrary from './pages/user/ExerciseLibrary';
import MealLibrary from './pages/user/MealLibrary';
import PlanLibrary from './pages/user/PlanLibrary';
import WeeklyPlanLibrary from './pages/user/WeeklyPlanLibrary';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/pricing/success" element={<PricingSuccess />} />

          {/* Protected Admin Routes - Must come first to avoid being caught by user routes */}
          <Route element={<ProtectedAdminRoute />}>
            <Route
              path="/admin/*"
              element={
                <AdminLayout>
                  <Routes>
                    <Route path="/dashboard" element={<AdminDashboard />} />
                    <Route path="/nutrition/meals" element={<MealManagement />} />
                    <Route path="/workouts/exercises" element={<ExerciseManagement />} />
                    <Route path="/nutrition/plans" element={<PlanManagement />} />
                    <Route path="/nutrition/weekly-plans" element={<WeeklyPlanManagement />} />
                    <Route path="/users" element={<UsersManagement />} />
                    <Route path="/users" element={<div>Người dùng — sắp có...</div>} />
                  </Routes>
                </AdminLayout>
              }
            />
          </Route>

          {/* Protected User Routes */}
          <Route element={<ProtectedRoute />}> 
            {/* Onboarding - không có Layout sidebar */}
            <Route path="/onboarding" element={<Onboarding />} />
            
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/nutrition" element={<MealLibrary />} />
                    <Route path="/nutrition/plans" element={<PlanLibrary />} />
                    <Route path="/nutrition/weekly-plans" element={<WeeklyPlanLibrary />} />
                    <Route path="/nutrition/diary" element={<FoodDiary />} />
                    <Route path="/workouts" element={<ExerciseLibrary />} />
                    <Route path="/progress" element={<Progress />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/pricing" element={<Pricing />} />
                  </Routes>
                </Layout>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
