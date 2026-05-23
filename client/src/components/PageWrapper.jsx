import { Suspense } from 'react';
import PageErrorBoundary from './PageErrorBoundary';

export default function PageWrapper({ children }) {
  return (
    <PageErrorBoundary>
      {children}
    </PageErrorBoundary>
  );
}
