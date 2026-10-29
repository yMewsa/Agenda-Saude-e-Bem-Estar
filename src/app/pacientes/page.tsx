'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IPaciente } from '@/models/Paciente';

export default function PaginaPacientes() {
  const [pacientes, definirPacientes] = useState<(IPaciente & { _id: string })[]>([]);
  const [busca, definirBusca] = useState('');
  const [novoNome, definirNovoNome] = useState('');
  const [novoTelefone, definirNovoTelefone] = useState('');
  const [exibirFormulario, definirExibirFormulario] = useState(false);
  const [carregando, definirCarregando] = useState(true);

  // Carrega os pacientes da API
  const carregarPacientes = useCallback(async () => {
    definirCarregando(true);
    try {
      const resp = await fetch(`/api/pacientes?busca=${encodeURIComponent(busca)}`);
      const dados = await resp.json();
      if (Array.isArray(dados)) definirPacientes(dados);
    } finally {
      definirCarregando(false);
    }
  }, [busca]);

  useEffect(() => {
    carregarPacientes();
  }, [carregarPacientes]);

  // Salva um novo paciente via POST na API
  const salvarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || !novoTelefone.trim()) return;
    await fetch('/api/pacientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoNome, telefone: novoTelefone }),
    });
    definirNovoNome('');
    definirNovoTelefone('');
    definirExibirFormulario(false);
    carregarPacientes();
  };

  // Exclui um paciente pelo identificador
  const excluirPaciente = async (id: string) => {
    if (!confirm('Deseja realmente remover este paciente?')) return;
    await fetch(`/api/pacientes/${id}`, { method: 'DELETE' });
    carregarPacientes();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#00695C', textTransform: 'uppercase' }}>
            ● Sistema Operante
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>Gestão Cadastral de Pacientes</h1>
          <p style={{ fontSize: '13px', color: '#64748B' }}>Gerencie prontuários, contatos e informações cadastrais</p>
        </div>

        <button type="button" onClick={() => definirExibirFormulario(!exibirFormulario)} className="btn btn-primario">
          <span>+</span> Novo Paciente
        </button>
      </div>

      {/* Formulário Colapsável de Cadastro */}
      {exibirFormulario && (
        <form onSubmit={salvarPaciente} style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>Cadastrar Novo Paciente</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Nome Completo *</label>
              <input type="text" value={novoNome} onChange={(e) => definirNovoNome(e.target.value)} required placeholder="Ex: Beatriz Guimarães" style={{ width: '100%', padding: '8px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Telefone / WhatsApp *</label>
              <input type="text" value={novoTelefone} onChange={(e) => definirNovoTelefone(e.target.value)} required placeholder="Ex: (11) 98765-4321" style={{ width: '100%', padding: '8px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primario">Salvar</button>
              <button type="button" onClick={() => definirExibirFormulario(false)} className="btn btn-secundario">Cancelar</button>
            </div>
          </div>
        </form>
      )}

      {/* Tabela de Listagem de Pacientes */}
      <div className="tabela-container">
        <div className="tabela-cabecalho-acoes">
          <input type="text" placeholder="Buscar por nome ou telefone..." value={busca} onChange={(e) => definirBusca(e.target.value)} style={{ width: '320px' }} />
          <span style={{ fontSize: '13px', color: '#64748B' }}>Total: <strong>{pacientes.length}</strong> pacientes</span>
        </div>

        <table className="tabela-moderna">
          <thead>
            <tr>
              <th>Iniciais</th>
              <th>Paciente</th>
              <th>Contato / WhatsApp</th>
              <th>Data de Cadastro</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>Carregando pacientes...</td></tr>
            ) : pacientes.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>Nenhum paciente encontrado.</td></tr>
            ) : (
              pacientes.map((p) => {
                const iniciais = p.nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <tr key={p._id}>
                    <td style={{ width: '60px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#E8F5E9', color: '#00695C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                        {iniciais}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{p.nome}</td>
                    <td>{p.telefone}</td>
                    <td style={{ color: '#64748B', fontSize: '13px' }}>
                      {p.criadoEm ? new Date(p.criadoEm).toLocaleDateString('pt-BR') : 'Hoje'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button type="button" className="btn-icone" onClick={() => excluirPaciente(p._id)} title="Excluir paciente">
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
