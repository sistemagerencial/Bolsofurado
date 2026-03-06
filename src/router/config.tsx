import * as React from 'react';
import { lazy } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';

const HomePage = lazy(() => import('../pages/home/page'));
const ReceitasPage = lazy(() => import('../pages/receitas/page'));
const DespesasPage = lazy(() => import('../pages/despesas/page'));
const InvestimentosPage = lazy(() => import('../pages/investimentos/page'));
const PlanejamentoPage = lazy(() => import('../pages/planejamento/page'));
const RelatoriosPage = lazy(() => import('../pages/relatorios/page'));
const PatrimoniosPage = lazy(() => import('../pages/patrimonios/page'));
const CalculadorasPage = lazy(() => import('../pages/calculadoras/page'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegistroPage = lazy(() => import('../pages/auth/RegistroPage'));
const RecuperarSenhaPage = lazy(() => import('../pages/auth/RecuperarSenhaPage'));
const RedefinirSenhaPage = lazy(() => import('../pages/auth/RedefinirSenhaPage'));
const EmailConfirmadoPage = lazy(() => import('../pages/auth/EmailConfirmadoPage'));
const AdminPage = lazy(() => import('../pages/admin/page'));
const AdminManutencaoPage = lazy(() => import('../pages/admin/manutencao/page'));
const WebhooksPage = lazy(() => import('../pages/admin/webhooks/page'));
const StatusPage = lazy(() => import('../pages/checkout/StatusPage'));
const PerfilPage = lazy(() => import('../pages/perfil/page'));
const AssinaturaPage = lazy(() => import('../pages/assinatura/page'));

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/registro',
    element: <RegistroPage />,
  },
  {
    path: '/recuperar-senha',
    element: <RecuperarSenhaPage />,
  },
  {
    path: '/redefinir-senha',
    element: <RedefinirSenhaPage />,
  },
  {
    path: '/email-confirmado',
    element: <EmailConfirmadoPage />,
  },
  {
    path: '/checkout',
    element: (
      <ProtectedRoute>
        {React.createElement(lazy(() => import('../pages/checkout/page')))}
      </ProtectedRoute>
    ),
  },
  {
    path: '/checkout/status',
    element: (
      <ProtectedRoute>
        <StatusPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/manutencao',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminManutencaoPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/webhooks',
    element: (
      <ProtectedRoute requiredRole="admin">
        <WebhooksPage />
      </ProtectedRoute>
    ),
  },
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
    element: <Navigate to='/' replace />,
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
    path: '/perfil',
    element: (
      <ProtectedRoute>
        <PerfilPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/assinatura',
    element: (
      <ProtectedRoute>
        <AssinaturaPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;