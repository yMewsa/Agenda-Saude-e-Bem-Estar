import type { Metadata } from 'next';
import React from 'react';
import '@/styles/globals.scss';
import { ProvedorAutenticacao } from '@/contexts/AuthContext';
import { AppLayoutWrapper } from '@/components/AppLayoutWrapper';

export const metadata: Metadata = {
  title: 'Clínica Saúde & Bem-estar - Gestão Operacional',
  description: 'Sistema integrado de agendamentos e gestão clínica',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <ProvedorAutenticacao>
          <AppLayoutWrapper>{children}</AppLayoutWrapper>
        </ProvedorAutenticacao>
      </body>
    </html>
  );
}
