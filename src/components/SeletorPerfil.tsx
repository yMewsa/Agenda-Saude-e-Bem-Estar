'use client';

import React, { useState, useEffect } from 'react';
import { useAutenticacao } from '@/contexts/AuthContext';
import { IDoutor } from '@/models/Doutor';

// Estilos visuais encapsulados para os botões do seletor
function obterEstiloBotao(estaAtivo: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: estaAtivo ? 700 : 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: estaAtivo ? '1.5px solid #00695c' : '1px solid #e0e0e0',
    backgroundColor: estaAtivo ? '#e8f5e9' : '#ffffff',
    color: estaAtivo ? '#00695c' : '#555555',
    boxShadow: estaAtivo ? '0 2px 4px rgba(0, 105, 92, 0.12)' : 'none',
  };
}

export function SeletorPerfil() {
  const { usuario, loginComo, carregando } = useAutenticacao();
  const [medicos, definirMedicos] = useState<(IDoutor & { _id: string })[]>([]);
  const ehGestao = usuario?.role === 'GESTOR' || usuario?.role === 'RECEPCIONISTA';
  const ehMedico = usuario?.role === 'MEDICO';

  // Carrega os médicos da clínica para permitir alternância precisa
  useEffect(() => {
    fetch('/api/medicos')
      .then((r) => r.json())
      .then((dados) => {
        if (Array.isArray(dados)) definirMedicos(dados);
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        type="button"
        disabled={carregando}
        onClick={() => loginComo('GESTOR')}
        style={obterEstiloBotao(ehGestao)}
        title="Alternar visão para Gestão da Clínica"
      >
        <span>👔</span>
        <span>Gestor</span>
      </button>

      {medicos.length > 0 ? (
        <select
          value={ehMedico ? usuario?.doctorId || '' : ''}
          onChange={(e) => {
            const idSelecionado = e.target.value;
            if (idSelecionado) loginComo('MEDICO', idSelecionado);
          }}
          disabled={carregando}
          style={{
            ...obterEstiloBotao(ehMedico),
            appearance: 'auto',
            paddingRight: '24px',
          }}
          title="Selecione o médico para visualizar sua agenda exclusiva"
        >
          <option value="" disabled={ehMedico}>
            🩺 {ehMedico ? `Dr(a). ${usuario?.name}` : 'Ver como Médico...'}
          </option>
          {medicos.map((m) => (
            <option key={m._id} value={m._id}>
              🩺 {m.nome} ({m.especialidade})
            </option>
          ))}
        </select>
      ) : (
        <button
          type="button"
          disabled={carregando}
          onClick={() => loginComo('MEDICO')}
          style={obterEstiloBotao(ehMedico)}
        >
          <span>🩺</span>
          <span>Médico</span>
        </button>
      )}
    </div>
  );
}

export default SeletorPerfil;
