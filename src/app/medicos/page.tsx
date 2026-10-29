'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IDoutor } from '@/models/Doutor';

export default function PaginaMedicos() {
  const [medicos, definirMedicos] = useState<(IDoutor & { _id: string })[]>([]);
  const [busca, definirBusca] = useState('');
  const [novoNome, definirNovoNome] = useState('');
  const [novaEspecialidade, definirNovaEspecialidade] = useState('');
  const [exibirFormulario, definirExibirFormulario] = useState(false);
  const [carregando, definirCarregando] = useState(true);
  const [salvando, definirSalvando] = useState(false);
  const [erro, definirErro] = useState<string | null>(null);

  // Carrega os médicos da API
  const carregarMedicos = useCallback(async () => {
    definirCarregando(true);
    try {
      const resp = await fetch(`/api/medicos?busca=${encodeURIComponent(busca)}`);
      const dados = await resp.json();
      if (Array.isArray(dados)) definirMedicos(dados);
    } finally {
      definirCarregando(false);
    }
  }, [busca]);

  useEffect(() => {
    carregarMedicos();
  }, [carregarMedicos]);

  // Cadastra um novo médico no sistema com tratamento de resposta
  const salvarMedico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || !novaEspecialidade.trim()) return;
    definirSalvando(true);
    definirErro(null);
    try {
      const resp = await fetch('/api/medicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome, especialidade: novaEspecialidade }),
      });
      const dados = await resp.json();
      if (!resp.ok) {
        definirErro(dados.erro || 'Erro ao cadastrar médico.');
        return;
      }
      definirNovoNome('');
      definirNovaEspecialidade('');
      definirExibirFormulario(false);
      await carregarMedicos();
    } catch {
      definirErro('Falha de conexão com o servidor.');
    } finally {
      definirSalvando(false);
    }
  };

  // Remove um médico da base de dados
  const excluirMedico = async (id: string) => {
    if (!confirm('Deseja realmente remover este médico?')) return;
    await fetch(`/api/medicos/${id}`, { method: 'DELETE' });
    await carregarMedicos();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#00695C', textTransform: 'uppercase' }}>
            ● Equipe Especializada
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>Corpo Clínico & Especialidades</h1>
          <p style={{ fontSize: '13px', color: '#64748B' }}>Gerencie médicos credenciados, especialidades e agendas de plantão</p>
        </div>

        <button type="button" onClick={() => definirExibirFormulario(!exibirFormulario)} className="btn btn-primario">
          <span>+</span> Novo Médico
        </button>
      </div>

      {erro && (
        <div style={{ padding: '12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 600 }}>
          ⚠️ {erro}
        </div>
      )}

      {/* Formulário de Cadastro de Médico */}
      {exibirFormulario && (
        <form onSubmit={salvarMedico} style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>Cadastrar Novo Médico</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Nome do Médico *</label>
              <input type="text" value={novoNome} onChange={(e) => definirNovoNome(e.target.value)} required placeholder="Ex: Dr. Fernando Lima" style={{ width: '100%', padding: '8px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Especialidade Médica *</label>
              <input type="text" value={novaEspecialidade} onChange={(e) => definirNovaEspecialidade(e.target.value)} required placeholder="Ex: Cardiologia, Pediatria..." style={{ width: '100%', padding: '8px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={salvando} className="btn btn-primario">
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" onClick={() => definirExibirFormulario(false)} className="btn btn-secundario">Cancelar</button>
            </div>
          </div>
        </form>
      )}

      {/* Tabela de Listagem de Médicos */}
      <div className="tabela-container">
        <div className="tabela-cabecalho-acoes">
          <input type="text" placeholder="Buscar por médico ou especialidade..." value={busca} onChange={(e) => definirBusca(e.target.value)} style={{ width: '320px' }} />
          <span style={{ fontSize: '13px', color: '#64748B' }}>Total: <strong>{medicos.length}</strong> médicos ativos</span>
        </div>

        <table className="tabela-moderna">
          <thead>
            <tr>
              <th>Identificação</th>
              <th>Nome do Médico</th>
              <th>Especialidade</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>Carregando corpo clínico...</td></tr>
            ) : medicos.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>Nenhum médico cadastrado.</td></tr>
            ) : (
              medicos.map((m) => (
                <tr key={m._id}>
                  <td style={{ width: '50px', fontSize: '20px' }}>🩺</td>
                  <td style={{ fontWeight: 700 }}>{m.nome}</td>
                  <td>
                    <span style={{ padding: '4px 10px', background: '#F1F5F9', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                      {m.especialidade}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#15803D', fontWeight: 600, fontSize: '12px' }}>● Ativo na Unidade</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="btn-icone" onClick={() => excluirMedico(m._id)} title="Excluir médico">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
