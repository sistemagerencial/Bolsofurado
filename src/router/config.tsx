import { lazy } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import ProtectedRoute from '../lib/ProtectedRoute';

const HomePage = lazy(() => import('../pages/home/page'));
const ReceitasPage = lazy(() => import('../pages/receitas/page'));
const DespesasPage = lazy(() => import('../pages/despesas/page'));
const InvestimentosPage = lazy(() => import('../pages/investimentos/page'));
const PlanejamentoPage = lazy(() => import('../pages/planejamento/page'));
const RelatoriosPage = lazy(() => import('../pages/relatorios/page'));
const PatrimoniosPage = lazy(() => import('../pages/patrimonios/page'));
const CalculadorasPage = lazy(() => import('../pages/calculadoras/page'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));
const LoginPage = lazy(() => import('../pages/login/page'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/receitas',
    element: (
      <ProtectedRoute>
        <ReceitasPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/despesas',
    element: (
      <ProtectedRoute>
        <DespesasPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/investimentos',
    element: (
      <ProtectedRoute>
        <InvestimentosPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/planejamento',
    element: (
      <ProtectedRoute>
        <PlanejamentoPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/relatorios',
    element: (
      <ProtectedRoute>
        <RelatoriosPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/patrimonios',
    element: (
      <ProtectedRoute>
        <PatrimoniosPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/calculadoras',
    element: (
      <ProtectedRoute>
        <CalculadorasPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;
