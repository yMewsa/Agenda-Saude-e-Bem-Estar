'use client';

import React from 'react';
import { useAutenticacao } from '@/contexts/AuthContext';
import { SeletorPerfil } from './SeletorPerfil';

// Formata a data atual em português com dia da semana por extenso
function obterDataFormatada(): string {
  const agora = new Date();
  return agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function Header() {
  const { usuario, logout } = useAutenticacao();
  const dataHoje = obterDataFormatada();
  const iniciais = (usuario?.name || 'U').substring(0, 2).toUpperCase();

  return (
    <header className="header-topo">
      <div className="header-topo__busca">
        <span className="icone-lupa">🔍</span>
        <input
          type="text"
          placeholder="Buscar paciente, especialidade ou médico..."
          readOnly
        />
      </div>

      <div className="header-topo__acoes">
        {/* Role Switcher para alternar papéis rapidamente na apresentação */}
        <SeletorPerfil />

        <div className="header-topo__data">
          <span>📅</span>
          <span style={{ textTransform: 'capitalize' }}>{dataHoje}</span>
        </div>

        <div className="header-topo__usuario">
          <div className="avatar">{iniciais}</div>
          <div className="info-usuario">
            <span className="nome">{usuario?.name || 'Usuário'}</span>
            <span className="papel">
              {usuario?.role === 'MEDICO' ? 'Corpo Clínico' : 'Gestão / Recepção'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="btn-icone"
          title="Encerrar sessão (Logout)"
          style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
        >
          <span>🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
