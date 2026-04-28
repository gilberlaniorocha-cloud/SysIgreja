import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutGrid, 
  Landmark, 
  CreditCard,
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LogOut,
  Building2,
  Bookmark,
  Menu,
  X,
  Box
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  const { session, loading, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileMenu();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { name: 'Contas Bancárias', href: '/contas', icon: Landmark },
    { name: 'Cartões de Crédito', href: '/cartoes', icon: CreditCard },
    { name: 'Categorias', href: '/categorias', icon: Bookmark },
    { name: 'Receitas', href: '/receitas', icon: TrendingUp },
    { name: 'Despesas', href: '/despesas', icon: TrendingDown },
    { name: 'Patrimônio', href: '/patrimonios', icon: Box },
    { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
    { name: 'Igreja', href: '/igreja', icon: Building2 },
  ];

  return (
    <div className="flex h-screen bg-gray-50 print:block print:h-auto print:bg-white overflow-hidden">
      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileMenu}
            className="fixed inset-0 z-40 bg-gray-600/75 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {(isMobileMenuOpen || !isMobile) && (
          <motion.div 
            initial={isMobile ? { x: '-100%' } : false}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col md:relative md:translate-x-0 print:hidden",
              isMobile && !isMobileMenuOpen && "hidden"
            )}
          >
            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="bg-indigo-600 p-2 rounded-lg mr-3 shadow-sm">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">SysIgreja</span>
              </div>
              <button 
                onClick={closeMobileMenu}
                className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none p-2 rounded-md hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      isActive 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  closeMobileMenu();
                  signOut();
                }}
                className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                Sair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:block print:overflow-visible">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 print:hidden">
          <div className="flex items-center">
            <div className="bg-indigo-600 p-1.5 rounded-lg mr-2 shadow-sm">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">SysIgreja</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 print:block print:p-0 print:overflow-visible">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
