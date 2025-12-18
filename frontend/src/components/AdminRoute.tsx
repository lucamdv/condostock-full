import { Navigate, Outlet } from 'react-router-dom';

export function AdminRoute() {
  const userJson = localStorage.getItem('condostock_user');
  const user = userJson ? JSON.parse(userJson) : null;

  // Se for ADMIN, deixa passar (Outlet). 
  // Se não for (ou não tiver logado), joga pro Dashboard ('/')
  return user?.role === 'ADMIN' ? <Outlet /> : <Navigate to="/" />;
}