'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ItemNavegacao {
  rotulo: string;
  rota: string;
  icone: string;
  contagem?: string;
}

const ITENS_MENU: ItemNavegacao[] = [
  { rotulo: 'Consultas', rota: '/', icone: '📅', contagem: 'Hoje' },
  { rotulo: 'Pacientes', rota: '/pacientes', icone: '👥' },
  { rotulo: 'Médicos', rota: '/medicos', icone: '🩺' },
];

export function Sidebar() {
  const caminhoAtual = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="logo-icone">✚</div>
        <div className="logo-texto">
          <h1>Clínica Saúde & Bem-estar</h1>
          <span>Sistema Integrado</span>
        </div>
      </div>

      <div className="sidebar__status-unidade">
        <span>
          <span className="dot-ativa"></span> Unidade Centro
        </span>
        <span className="badge-aberta">Aberta</span>
      </div>

      <nav className="sidebar__navegacao">
        <div className="secao-titulo">Menu Principal</div>
        {ITENS_MENU.map((item) => {
          const estaAtivo = caminhoAtual === item.rota;
          return (
            <Link
              key={item.rota}
              href={item.rota}
              className={`nav-item ${estaAtivo ? 'ativo' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="icone">{item.icone}</span>
                <span>{item.rotulo}</span>
              </div>
              {item.contagem && (
                <span className="badge-contagem">{item.contagem}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar__rodape">
        <small>© 2026 Clínica Saúde & Bem-estar</small>
      </div>
    </aside>
  );
}

export default Sidebar;
