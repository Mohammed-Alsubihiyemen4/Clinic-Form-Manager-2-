import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation, Redirect } from 'wouter';

import { AuthProvider, useAuth } from '@/context/auth';
import { MainLayout } from '@/components/layout/main-layout';
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import TrainingCertificates from '@/pages/training-certificates/index';
import TrainingCertificateForm from '@/pages/training-certificates/form';
import MedicalReports from '@/pages/medical-reports/index';
import MedicalReportForm from '@/pages/medical-reports/form';
import Invoices from '@/pages/invoices/index';
import InvoiceForm from '@/pages/invoices/form';
import Customers from '@/pages/customers';
import Doctors from '@/pages/doctors';
import Users from '@/pages/users';
import Products from '@/pages/products';
import AuditLogs from '@/pages/audit-logs';
import Settings from '@/pages/settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ page, component: Component }: { page: string; component: React.ComponentType }) {
  const { user, hasAccess } = useAuth();
  if (!user) return <Redirect to="/login" />;
  if (!hasAccess(page)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-5xl">🔒</div>
        <h2 className="text-xl font-bold text-foreground">غير مصرح لك بالدخول</h2>
        <p className="text-muted-foreground text-sm">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
      </div>
    );
  }
  return <Component />;
}

function Router() {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user && location !== '/login') {
    return <Redirect to="/login" />;
  }

  if (user && location === '/login') {
    return <Redirect to="/" />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={() => <ProtectedRoute page="dashboard" component={Dashboard} />} />

        <Route path="/training-certificates" component={() => <ProtectedRoute page="training-certificates" component={TrainingCertificates} />} />
        <Route path="/training-certificates/new" component={() => <ProtectedRoute page="training-certificates" component={TrainingCertificateForm} />} />
        <Route path="/training-certificates/:id" component={() => <ProtectedRoute page="training-certificates" component={TrainingCertificateForm} />} />

        <Route path="/medical-reports" component={() => <ProtectedRoute page="medical-reports" component={MedicalReports} />} />
        <Route path="/medical-reports/new" component={() => <ProtectedRoute page="medical-reports" component={MedicalReportForm} />} />
        <Route path="/medical-reports/:id" component={() => <ProtectedRoute page="medical-reports" component={MedicalReportForm} />} />

        <Route path="/invoices" component={() => <ProtectedRoute page="invoices" component={Invoices} />} />
        <Route path="/invoices/new" component={() => <ProtectedRoute page="invoices" component={InvoiceForm} />} />
        <Route path="/invoices/:id" component={() => <ProtectedRoute page="invoices" component={InvoiceForm} />} />

        <Route path="/products" component={() => <ProtectedRoute page="products" component={Products} />} />
        <Route path="/customers" component={() => <ProtectedRoute page="customers" component={Customers} />} />
        <Route path="/doctors" component={() => <ProtectedRoute page="doctors" component={Doctors} />} />
        <Route path="/users" component={() => <ProtectedRoute page="users" component={Users} />} />
        <Route path="/audit-logs" component={() => <ProtectedRoute page="audit-logs" component={AuditLogs} />} />
        <Route path="/settings" component={() => <ProtectedRoute page="settings" component={Settings} />} />

        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
