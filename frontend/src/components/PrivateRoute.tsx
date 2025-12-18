import { Navigate, Outlet } from 'react-router-dom';

export function PrivateRoute() {
  // Verifica se o crachá (token) existe no navegador
  const token = localStorage.getItem('condostock_token');

  // Se tiver token, renderiza o conteúdo (Outlet). Se não, chuta pro /login
  return token ? <Outlet /> : <Navigate to="/login" />;
}