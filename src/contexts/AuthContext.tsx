'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { PayloadToken, PapelUsuario } from '@/lib/auth';

// Interface das propriedades fornecidas pelo contexto de autenticação
export interface ContextoAutenticacaoTipo {
  usuario: PayloadToken | null;
  carregando: boolean;
  papelAtual: PapelUsuario | null;
  loginComo: (papel: PapelUsuario, idMedico?: string) => Promise<void>;
  loginComCredenciais: (email: string, senha: string, papel?: PapelUsuario) => Promise<void>;
  alternarPapel: () => Promise<void>;
  logout: () => Promise<void>;
}

const ContextoAutenticacao = createContext<ContextoAutenticacaoTipo | undefined>(undefined);
const CHAVE_SESSAO_LOCAL = '@agenda_saude:usuario';

export function ProvedorAutenticacao({ children }: { children: React.ReactNode }) {
  const [usuario, definirUsuario] = useState<PayloadToken | null>(null);
  const [carregando, definirCarregando] = useState<boolean>(true);

  // Executa o login direto pelo papel e médico selecionado
  const loginComo = useCallback(async (papel: PapelUsuario, idMedico?: string) => {
    definirCarregando(true);
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ papel, doctorId: idMedico }),
      });
      const dados = await resp.json();
      if (dados.sucesso && dados.usuario) {
        definirUsuario(dados.usuario);
        localStorage.setItem(CHAVE_SESSAO_LOCAL, JSON.stringify(dados.usuario));
      }
    } finally {
      definirCarregando(false);
    }
  }, []);

  // Executa o login validando credenciais (email e senha)
  const loginComCredenciais = useCallback(async (email: string, senha: string, papel?: PapelUsuario) => {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha, papel }),
    });
    const dados = await resp.json();
    if (!resp.ok || !dados.sucesso) {
      throw new Error(dados.erro || 'Falha na autenticação');
    }
    definirUsuario(dados.usuario);
    localStorage.setItem(CHAVE_SESSAO_LOCAL, JSON.stringify(dados.usuario));
  }, []);

  // Alterna dinamicamente entre os papéis de Gestor e Médico
  const alternarPapel = useCallback(async () => {
    const ehGestao = usuario?.role === 'GESTOR' || usuario?.role === 'RECEPCIONISTA';
    const proximoPapel: PapelUsuario = ehGestao ? 'MEDICO' : 'GESTOR';
    await loginComo(proximoPapel);
  }, [usuario, loginComo]);

  // Encerra a sessão via API e redireciona para a página de login
  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    definirUsuario(null);
    localStorage.removeItem(CHAVE_SESSAO_LOCAL);
    window.location.href = '/login';
  }, []);

  // Inicializa a sessão recuperando do armazenamento local
  useEffect(() => {
    const sessaoSalva = localStorage.getItem(CHAVE_SESSAO_LOCAL);
    if (sessaoSalva) {
      try {
        definirUsuario(JSON.parse(sessaoSalva));
      } catch {
        localStorage.removeItem(CHAVE_SESSAO_LOCAL);
      }
    }
    definirCarregando(false);
  }, []);

  return (
    <ContextoAutenticacao.Provider
      value={{
        usuario,
        carregando,
        papelAtual: usuario?.role ?? null,
        loginComo,
        loginComCredenciais,
        alternarPapel,
        logout,
      }}
    >
      {children}
    </ContextoAutenticacao.Provider>
  );
}

// Hook de consumo do contexto de autenticação
export function useAutenticacao(): ContextoAutenticacaoTipo {
  const contexto = useContext(ContextoAutenticacao);
  if (!contexto) {
    throw new Error('useAutenticacao deve ser utilizado dentro de um ProvedorAutenticacao');
  }
  return contexto;
}

export default ProvedorAutenticacao;
