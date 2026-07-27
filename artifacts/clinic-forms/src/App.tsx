import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { MainLayout } from '@/components/layout/main-layout';
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

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        
        {/* Training Certificates */}
        <Route path="/training-certificates" component={TrainingCertificates} />
        <Route path="/training-certificates/new" component={TrainingCertificateForm} />
        <Route path="/training-certificates/:id" component={TrainingCertificateForm} />

        {/* Medical Reports */}
        <Route path="/medical-reports" component={MedicalReports} />
        <Route path="/medical-reports/new" component={MedicalReportForm} />
        <Route path="/medical-reports/:id" component={MedicalReportForm} />

        {/* Invoices */}
        <Route path="/invoices" component={Invoices} />
        <Route path="/invoices/new" component={InvoiceForm} />
        <Route path="/invoices/:id" component={InvoiceForm} />

        {/* Other Pages */}
        <Route path="/customers" component={Customers} />
        <Route path="/doctors" component={Doctors} />
        <Route path="/users" component={Users} />
        <Route path="/audit-logs" component={AuditLogs} />
        <Route path="/settings" component={Settings} />

        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
