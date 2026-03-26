import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AdminThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextType>({
  isDark: true,
  toggleTheme: () => {},
});

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('admin-theme');
    return stored ? stored === 'dark' : true; // default dark
  });

  useEffect(() => {
    localStorage.setItem('admin-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <AdminThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className={isDark ? 'admin-theme-dark' : 'admin-theme-light'}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}
