import { lazy, Suspense } from 'react';
import Skeleton from './components/Skeleton/Skeleton';

// Public Lazy-loaded pages
const Home = lazy(() => import('./pages/Home/Home'));
const Shop = lazy(() => import('./pages/Shop/Shop'));
const Product = lazy(() => import('./pages/Product/Product'));
const Login = lazy(() => import('./pages/Login/Login'));
const Register = lazy(() => import('./pages/Register/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword/ForgotPassword'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard/CustomerDashboard'));
const Checkout = lazy(() => import('./pages/Checkout/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation/OrderConfirmation'));
const StaticPage = lazy(() => import('./pages/StaticPage/StaticPage'));

// Admin Lazy-loaded components
const AdminLayout = lazy(() => import('./components/AdminLayout/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/AdminDashboard/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/AdminDashboard/AdminOrders'));
const AdminCustomers = lazy(() => import('./pages/AdminDashboard/AdminCustomers'));
const AdminPages = lazy(() => import('./pages/AdminDashboard/AdminPages'));
const AdminTheme = lazy(() => import('./pages/AdminDashboard/AdminTheme'));
const AdminPayments = lazy(() => import('./pages/AdminDashboard/AdminPayments'));
const AdminSettings = lazy(() => import('./pages/AdminDashboard/AdminSettings'));
const AdminProductEdit = lazy(() => import('./pages/AdminDashboard/AdminProductEdit'));

function PageLoader() {
  return (
    <div className="container page-padding">
      <Skeleton variant="page" />
    </div>
  );
}

const routes = [
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Home />
      </Suspense>
    ),
  },
  {
    path: '/shop',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Shop />
      </Suspense>
    ),
  },
  {
    path: '/shop/:category',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Shop />
      </Suspense>
    ),
  },
  {
    path: '/product/:slug',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Product />
      </Suspense>
    ),
  },
  {
    path: '/page/:slug',
    element: (
      <Suspense fallback={<PageLoader />}>
        <StaticPage />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Register />
      </Suspense>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ForgotPassword />
      </Suspense>
    ),
  },
  {
    path: '/account',
    element: (
      <Suspense fallback={<PageLoader />}>
        <CustomerDashboard />
      </Suspense>
    ),
  },
  {
    path: '/checkout',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Checkout />
      </Suspense>
    ),
  },
  {
    path: '/order-confirmation/:orderNumber',
    element: (
      <Suspense fallback={<PageLoader />}>
        <OrderConfirmation />
      </Suspense>
    ),
  },

  // ─── ADMIN DASHBOARD ROUTES ───────────────────────────────
  {
    path: '/admin',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminLayout />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminDashboard />
          </Suspense>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminDashboard />
          </Suspense>
        ),
      },
      {
        path: 'products',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminProducts />
          </Suspense>
        ),
      },
      {
        path: 'products/new',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminProductEdit />
          </Suspense>
        ),
      },
      {
        path: 'products/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminProductEdit />
          </Suspense>
        ),
      },
      {
        path: 'orders',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminOrders />
          </Suspense>
        ),
      },
      {
        path: 'customers',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminCustomers />
          </Suspense>
        ),
      },
      {
        path: 'pages',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminPages />
          </Suspense>
        ),
      },
      {
        path: 'theme',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminTheme />
          </Suspense>
        ),
      },
      {
        path: 'payments',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminPayments />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminSettings />
          </Suspense>
        ),
      },
    ],
  },
];

export default routes;
