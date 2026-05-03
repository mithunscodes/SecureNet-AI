import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

import App from './App';
import Home from './components/Home';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import ForgotPassword from './components/ForgotPassword';
import DashboardWrapper from './DashboardWrapper';
import Settings from './components/Settings';
import ProtectedRoute from './components/ProtectedRoute';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Protected routes with layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<App />}>
          <Route path="/dashboard" element={<DashboardWrapper />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>
);