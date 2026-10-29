'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const ehPaginaLogin = caminho === '/login';

  if (ehPaginaLogin) {
    return <main>{children}</main>;
  }

  return (
    <div className="layout-container">
      <Sidebar />
      <div className="conteudo-principal">
        <Header />
        <main className="area-pagina">{children}</main>
      </div>
    </div>
  );
}

export default AppLayoutWrapper;
