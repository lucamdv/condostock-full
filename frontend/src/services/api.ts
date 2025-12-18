import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// 👇 O INTERCEPTOR MÁGICO 👇
// Antes de todo pedido, ele vai no navegador, pega o token e anexa.
api.interceptors.request.use((config) => {
  // ATENÇÃO: Verifique se o nome da chave aqui é o mesmo que você salvou no Login.tsx
  // Geralmente é 'condostock_token' ou apenas 'token'. 
  // Vou colocar o código para tentar os dois nomes mais comuns.
  
  const token = localStorage.getItem('condostock_token') || localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});