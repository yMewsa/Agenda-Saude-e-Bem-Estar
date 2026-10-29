'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAutenticacao } from '@/contexts/AuthContext';
import { PapelUsuario } from '@/lib/auth';
import { IDoutor } from '@/models/Doutor';

export default function PaginaLogin() {
  const roteador = useRouter();
  const { loginComCredenciais, loginComo } = useAutenticacao();

  const [email, definirEmail] = useState('gestor@clinica.com');
  const [senha, definirSenha] = useState('senha123');
  const [papel, definirPapel] = useState<PapelUsuario>('GESTOR');
  const [medicos, definirMedicos] = useState<(IDoutor & { _id: string })[]>([]);
  const [carregando, definirCarregando] = useState(false);
  const [erro, definirErro] = useState<string | null>(null);

  // Carrega a listagem de médicos da clínica para os atalhos
  useEffect(() => {
    fetch('/api/medicos')
      .then((r) => r.json())
      .then((dados) => {
        if (Array.isArray(dados)) definirMedicos(dados);
      })
      .catch(() => {});
  }, []);

  // Altera os valores do formulário de acordo com o perfil selecionado
  const alterarPerfilSelecionado = (novoPapel: PapelUsuario) => {
    definirPapel(novoPapel);
    if (novoPapel === 'GESTOR') {
      definirEmail('gestor@clinica.com');
    } else {
      definirEmail(medicos[0]?.nome ? `${medicos[0].nome.toLowerCase().replace(/\s+/g, '')}@clinica.com` : 'medico@clinica.com');
    }
    definirSenha('senha123');
    definirErro(null);
  };

  // Submete as credenciais para verificação JWT
  const submeterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    definirCarregando(true);
    definirErro(null);
    try {
      await loginComCredenciais(email, senha, papel);
      roteador.push('/');
    } catch {
      definirErro('Credenciais inválidas ou falha de autenticação.');
    } finally {
      definirCarregando(false);
    }
  };

  // Executa login instantâneo com médico específico para a apresentação
  const loginRapidoMedico = async (idMedico: string) => {
    definirCarregando(true);
    definirErro(null);
    try {
      await loginComo('MEDICO', idMedico);
      roteador.push('/');
    } catch {
      definirErro('Falha no login do médico.');
    } finally {
      definirCarregando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '36px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06)' }}>
        
        {/* Logotipo e Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #00695C 0%, #00897B 100%)', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
            ✚
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Clínica Saúde & Bem-estar</h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Autenticação e Controle de Acesso JWT</p>
        </div>

        {/* Alerta de Erro */}
        {erro && (
          <div style={{ padding: '12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', fontWeight: 600 }}>
            ⚠️ {erro}
          </div>
        )}

        {/* Seletor de Perfil */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => alterarPerfilSelecionado('GESTOR')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: papel === 'GESTOR' ? 700 : 500,
              border: papel === 'GESTOR' ? '2px solid #00695C' : '1px solid #CBD5E1',
              background: papel === 'GESTOR' ? '#E8F5E9' : '#FFFFFF',
              color: papel === 'GESTOR' ? '#00695C' : '#475569',
              cursor: 'pointer',
            }}
          >
            👔 Gestor
          </button>
          <button
            type="button"
            onClick={() => alterarPerfilSelecionado('MEDICO')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: papel === 'MEDICO' ? 700 : 500,
              border: papel === 'MEDICO' ? '2px solid #00695C' : '1px solid #CBD5E1',
              background: papel === 'MEDICO' ? '#E8F5E9' : '#FFFFFF',
              color: papel === 'MEDICO' ? '#00695C' : '#475569',
              cursor: 'pointer',
            }}
          >
            🩺 Médico
          </button>
        </div>

        {/* Formulário com Email e Senha */}
        <form onSubmit={submeterLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#0F172A' }}>
              Email de Acesso
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => definirEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#0F172A' }}>
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => definirSenha(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="btn btn-primario"
            style={{ width: '100%', padding: '12px', fontSize: '14px' }}
          >
            {carregando ? 'Validando Token JWT...' : 'Entrar no Sistema'}
          </button>
        </form>

        {/* Bloco de Demonstração Rápida */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center' }}>
            Atalhos para Demonstração
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              disabled={carregando}
              onClick={async () => {
                definirCarregando(true);
                await loginComo('GESTOR');
                roteador.push('/');
              }}
              className="btn btn-secundario"
              style={{ width: '100%', justifyContent: 'flex-start', fontSize: '12px' }}
            >
              <span>⚡</span>
              <span>Acessar como <strong>Gestor Geral</strong> (Lari Gestora)</span>
            </button>

            {medicos.map((m) => (
              <button
                key={m._id}
                type="button"
                disabled={carregando}
                onClick={() => loginRapidoMedico(m._id)}
                className="btn btn-secundario"
                style={{ width: '100%', justifyContent: 'flex-start', fontSize: '12px' }}
              >
                <span>🩺</span>
                <span>Acessar como <strong>{m.nome}</strong> ({m.especialidade})</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
