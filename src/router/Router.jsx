import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getToken, getCurrentUser } from '../utils/api.js';
import { can, getUserRole } from '../utils/permissions.js';
import Forbidden from '../pages/Forbidden.jsx';

const RouterContext = createContext(null);
const RouteParamsContext = createContext({});

// ------------------------------------------------------------------
// Helper: ambil pathname dari window.location.hash
// ------------------------------------------------------------------
export function getHashPath() {
  const hash = window.location.hash || '';
  if (!hash || hash === '#' || hash === '#/') return '/';
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;
  const pathWithoutQuery = clean.split('?')[0];
  return pathWithoutQuery.startsWith('/') ? pathWithoutQuery : `/${pathWithoutQuery}`;
}

// ------------------------------------------------------------------
// Helper: match pattern seperti /peralatan/detail/:id dengan path aktual
// ------------------------------------------------------------------
function matchPath(pattern, pathname) {
  if (pattern === '*') return { matched: true, params: {} };
  if (pattern === pathname) return { matched: true, params: {} };

  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return { matched: false, params: {} };

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i];
    if (p.startsWith(':')) {
      const paramName = p.slice(1);
      params[paramName] = decodeURIComponent(pathParts[i]);
    } else if (p !== pathParts[i]) {
      return { matched: false, params: {} };
    }
  }

  return { matched: true, params };
}

// ------------------------------------------------------------------
// Router Provider
// ------------------------------------------------------------------
export function Router({ children }) {
  const [currentPath, setCurrentPath] = useState(getHashPath);

  const navigate = useCallback((to, { replace = false } = {}) => {
    const formatted = to.startsWith('/') ? to : `/${to}`;
    if (replace) {
      window.location.replace(`#${formatted}`);
    } else {
      window.location.hash = formatted;
    }
  }, []);

  useEffect(() => {
    function handleHashChange() {
      const p = getHashPath();
      setCurrentPath(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleSessionExpired() {
      navigate('/login');
    }

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('sikepo_session_expired', handleSessionExpired);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('sikepo_session_expired', handleSessionExpired);
    };
  }, [navigate]);

  const value = useMemo(() => ({
    pathname: currentPath,
    navigate,
  }), [currentPath, navigate]);

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
}

// ------------------------------------------------------------------
// Hooks
// ------------------------------------------------------------------
export function useNavigate() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    return (to) => {
      window.location.hash = to.startsWith('/') ? to : `/${to}`;
    };
  }
  return ctx.navigate;
}

export function useLocation() {
  const ctx = useContext(RouterContext);
  return {
    pathname: ctx ? ctx.pathname : getHashPath(),
  };
}

export function useParams() {
  return useContext(RouteParamsContext);
}

// ------------------------------------------------------------------
// Route & Routes
// ------------------------------------------------------------------
export function Route({ path, element }) {
  return null; // Route hanya sebagai placeholder deskripsi untuk <Routes>
}

export function Routes({ children, fallback = null }) {
  const { pathname } = useLocation();

  let matchedElement = null;
  let matchedParams = {};
  let fallbackElement = fallback;

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child) || matchedElement) return;

    const { path, element } = child.props;
    if (path === '*') {
      fallbackElement = element;
      return;
    }

    const { matched, params } = matchPath(path, pathname);
    if (matched) {
      matchedElement = element;
      matchedParams = params;
    }
  });

  const finalElement = matchedElement || fallbackElement;

  return (
    <RouteParamsContext.Provider value={matchedParams}>
      {finalElement}
    </RouteParamsContext.Provider>
  );
}

// ------------------------------------------------------------------
// ProtectedRoute Guard
// ------------------------------------------------------------------
export function ProtectedRoute({
  children,
  element,
  feature = null,
  action = 'view',
  roles = null,
  redirectTo = '/login',
}) {
  const token = getToken();
  const user = getCurrentUser();
  const navigate = useNavigate();

  const content = element || children;

  // 1. Cek autentikasi
  if (!token || !user) {
    return <Navigate to={redirectTo} />;
  }

  // 2. Cek spesifik roles jika ada (array: ['admin', 'manager'])
  if (roles && Array.isArray(roles)) {
    const userRole = getUserRole(user);
    if (!roles.includes(userRole)) {
      return <Forbidden />;
    }
  }

  // 3. Cek permissions matrix jika ada feature
  if (feature) {
    if (!can(feature, action, user)) {
      return <Forbidden />;
    }
  }

  return content;
}

// ------------------------------------------------------------------
// Declarative Navigate Component
// ------------------------------------------------------------------
export function Navigate({ to, replace = true }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace });
  }, [to, replace, navigate]);

  return null;
}

// ------------------------------------------------------------------
// Link Component
// ------------------------------------------------------------------
export function Link({ to, children, className = '', ...props }) {
  const formatted = to.startsWith('/') ? to : `/${to}`;
  return (
    <a href={`#${formatted}`} className={className} {...props}>
      {children}
    </a>
  );
}
