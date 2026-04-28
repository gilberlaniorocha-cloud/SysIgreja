/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import UpdatePassword from './pages/UpdatePassword';
import Dashboard from './pages/Dashboard';
import Contas from './pages/Contas';
import Cartoes from './pages/Cartoes';
import Receitas from './pages/Receitas';
import Despesas from './pages/Despesas';
import Relatorios from './pages/Relatorios';
import Categorias from './pages/Categorias';
import Igreja from './pages/Igreja';
import Patrimonios from './pages/Patrimonios';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="contas" element={<Contas />} />
            <Route path="cartoes" element={<Cartoes />} />
            <Route path="categorias" element={<Categorias />} />
            <Route path="receitas" element={<Receitas />} />
            <Route path="despesas" element={<Despesas />} />
            <Route path="patrimonios" element={<Patrimonios />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="igreja" element={<Igreja />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
