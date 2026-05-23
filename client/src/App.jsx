import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from 'react-error-boundary';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import PageWrapper from './components/PageWrapper';
import NotFound from './pages/NotFound';

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

function PageLoader() {
  return <div className="page"><div className="loading">Loading page...</div></div>;
}

function Fallback({ error, resetErrorBoundary }) {
  return (
    <div className="page">
      <div className="empty-state">
        <h2>Something went wrong</h2>
        <p>{error.message}</p>
        <button className="btn-primary" onClick={resetErrorBoundary} style={{ marginTop: 16 }}>
          Try Again
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <ErrorBoundary FallbackComponent={Fallback}>
                <div className="app">
                  <Navbar />
                  <main className="main">
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                        <Route path="/products" element={<PageWrapper><Products /></PageWrapper>} />
                        <Route path="/product/:id" element={<PageWrapper><ProductDetail /></PageWrapper>} />
                        <Route path="/wishlist" element={<PageWrapper><Wishlist /></PageWrapper>} />
                        <Route path="/orders" element={<ProtectedRoute><PageWrapper><OrderHistory /></PageWrapper></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
                        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                        <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
                        <Route path="/cart" element={<PageWrapper><Cart /></PageWrapper>} />
                        <Route path="/checkout" element={<ProtectedRoute><PageWrapper><Checkout /></PageWrapper></ProtectedRoute>} />
                        <Route path="/admin" element={<ProtectedRoute adminOnly><PageWrapper><Admin /></PageWrapper></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </main>
                  <Footer />
                </div>
              </ErrorBoundary>
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
