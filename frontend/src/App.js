import React from 'react';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Layout>
          <Dashboard />
        </Layout>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;