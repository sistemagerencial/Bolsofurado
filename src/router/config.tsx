import { lazy } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';

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
    element: <HomePage />,
  },
  {
    path: '/dashboard',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/receitas',
    element: <ReceitasPage />,
  },
  {
    path: '/despesas',
    element: <DespesasPage />,
  },
  {
    path: '/investimentos',
    element: <InvestimentosPage />,
  },
  {
    path: '/planejamento',
    element: <PlanejamentoPage />,
  },
  {
    path: '/relatorios',
    element: <RelatoriosPage />,
  },
  {
    path: '/patrimonios',
    element: <PatrimoniosPage />,
  },
  {
    path: '/calculadoras',
    element: <CalculadorasPage />,
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
