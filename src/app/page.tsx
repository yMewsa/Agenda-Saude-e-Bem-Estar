'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAutenticacao } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/StatusBadge';
import { AppointmentModal } from '@/components/AppointmentModal';
import { IDoutor } from '@/models/Doutor';

interface ConsultaComRelacoes {
  _id: string;
  data: string;
  horario: string;
  status: 'Agendada' | 'Confirmada' | 'Realizada' | 'Cancelada';
  paciente: { _id: string; nome: string; telefone: string };
  doutor: { _id: string; nome: string; especialidade: string };
}

// Retorna a data atual no formato YYYY-MM-DD considerando o fuso local
function obterDataHojeLocal(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Retorna a data de amanhã no formato YYYY-MM-DD
function obterDataAmanhaLocal(): string {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const ano = amanha.getFullYear();
  const mes = String(amanha.getMonth() + 1).padStart(2, '0');
  const dia = String(amanha.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export default function PaginaDashboard() {
  const { usuario, papelAtual } = useAutenticacao();
  const ehGestao = papelAtual === 'GESTOR' || papelAtual === 'RECEPCIONISTA';
  const hoje = useMemo(() => obterDataHojeLocal(), []);

  const [consultas, definirConsultas] = useState<ConsultaComRelacoes[]>([]);
  const [medicos, definirMedicos] = useState<(IDoutor & { _id: string })[]>([]);
  const [filtroStatus, definirFiltroStatus] = useState<string>('Todos');
  const [filtroMedico, definirFiltroMedico] = useState<string>('');
  const [filtroData, definirFiltroData] = useState<string>(hoje);
  const [periodoAtivo, definirPeriodoAtivo] = useState<'HOJE' | 'AMANHA' | 'TODAS' | 'CUSTOM'>('HOJE');
  const [buscaNome, definirBuscaNome] = useState<string>('');
  const [modalAberto, definirModalAberto] = useState(false);
  const [consultaEmEdicao, definirConsultaEmEdicao] = useState<ConsultaComRelacoes | null>(null);
  const [carregando, definirCarregando] = useState(true);

  // Busca lista de consultas filtrada por médico e data específica
  const carregarConsultas = useCallback(async () => {
    definirCarregando(true);
    try {
      const parametros = new URLSearchParams();
      if (ehGestao && filtroMedico) parametros.set('medico', filtroMedico);
      if (!ehGestao && usuario?.doctorId) parametros.set('medico', usuario.doctorId);
      if (filtroData) parametros.set('data', filtroData);
      const resposta = await fetch(`/api/consultas?${parametros.toString()}`);
      const dados = await resposta.json();
      if (Array.isArray(dados)) definirConsultas(dados);
    } finally {
      definirCarregando(false);
    }
  }, [ehGestao, filtroMedico, filtroData, usuario]);

  // Carrega médicos cadastrados apenas se o usuário for da Gestão
  const carregarMedicos = useCallback(async () => {
    if (!ehGestao) return;
    try {
      const resp = await fetch('/api/medicos');
      const dados = await resp.json();
      if (Array.isArray(dados)) definirMedicos(dados);
    } catch {
      definirMedicos([]);
    }
  }, [ehGestao]);

  useEffect(() => {
    carregarConsultas();
    carregarMedicos();
  }, [carregarConsultas, carregarMedicos, papelAtual]);

  // Altera o período de data selecionado
  const selecionarPeriodo = (tipo: 'HOJE' | 'AMANHA' | 'TODAS') => {
    definirPeriodoAtivo(tipo);
    if (tipo === 'HOJE') definirFiltroData(obterDataHojeLocal());
    else if (tipo === 'AMANHA') definirFiltroData(obterDataAmanhaLocal());
    else definirFiltroData('');
  };

  // Altera o status da consulta
  const alterarStatusConsulta = async (id: string, novoStatus: string) => {
    await fetch(`/api/consultas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus }),
    });
    carregarConsultas();
  };

  // Filtra as consultas garantindo isolamento estrito se o usuário for Médico
  const consultasFiltradas = useMemo(() => {
    return consultas.filter((c) => {
      if (!ehGestao && usuario) {
        const idDoc = typeof c.doutor === 'object' ? c.doutor?._id : c.doutor;
        const nomeDoc = typeof c.doutor === 'object' ? c.doutor?.nome : '';
        const bateId = usuario.doctorId && idDoc === usuario.doctorId;
        const bateNome = usuario.name && nomeDoc?.toLowerCase() === usuario.name.toLowerCase();
        if (!bateId && !bateNome) return false;
      }

      const matchStatus = filtroStatus === 'Todos' || c.status === filtroStatus;
      const matchNome =
        !buscaNome ||
        c.paciente?.nome?.toLowerCase().includes(buscaNome.toLowerCase()) ||
        c.doutor?.nome?.toLowerCase().includes(buscaNome.toLowerCase());
      return matchStatus && matchNome;
    });
  }, [consultas, filtroStatus, buscaNome, ehGestao, usuario]);

  // Estatísticas operacionais
  const totalConsultas = consultasFiltradas.length;
  const totalConfirmadas = consultasFiltradas.filter((c) => c.status === 'Confirmada').length;
  const totalAgendadas = consultasFiltradas.filter((c) => c.status === 'Agendada').length;
  const totalRealizadas = consultasFiltradas.filter((c) => c.status === 'Realizada').length;
  const totalCanceladas = consultasFiltradas.filter((c) => c.status === 'Cancelada').length;
  const rotuloPeriodo = periodoAtivo === 'HOJE' ? 'Hoje' : periodoAtivo === 'AMANHA' ? 'Amanhã' : 'Período';

  return (
    <div>
      {/* Cabeçalho dinâmico por perfil */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#00695C', textTransform: 'uppercase' }}>
            ● {ehGestao ? 'Gestão Clínica • Central Operacional' : 'Área Médica Privada • Acesso Restrito'}
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
            {ehGestao ? 'Gestão Operacional de Consultas' : `Agenda Exclusiva - ${usuario?.name}`}
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            {ehGestao
              ? 'Monitoramento e controle geral de consultas, disponibilidade médica e fluxo da clínica.'
              : 'Você visualiza única e exclusivamente as consultas sob a sua responsabilidade médica.'}
          </p>
        </div>

        {ehGestao && (
          <button
            type="button"
            onClick={() => { definirConsultaEmEdicao(null); definirModalAberto(true); }}
            className="btn btn-primario"
          >
            <span>+</span> Nova Consulta
          </button>
        )}
      </div>

      {/* Cards de Métricas */}
      <div className="grid-metricas">
        <div className="card-metrica">
          <div className="card-metrica__cabecalho"><span>Total {rotuloPeriodo}</span><span>📅</span></div>
          <div className="card-metrica__corpo"><span className="numero">{totalConsultas}</span><span className="legenda">{ehGestao ? 'na clínica' : 'suas consultas'}</span></div>
        </div>
        <div className="card-metrica">
          <div className="card-metrica__cabecalho"><span>Confirmadas</span><span>🟢</span></div>
          <div className="card-metrica__corpo"><span className="numero">{totalConfirmadas}</span><span className="legenda">prontas</span></div>
        </div>
        <div className="card-metrica">
          <div className="card-metrica__cabecalho"><span>Agendadas</span><span>⏱️</span></div>
          <div className="card-metrica__corpo"><span className="numero">{totalAgendadas}</span><span className="legenda">aguardando</span></div>
        </div>
        <div className="card-metrica">
          <div className="card-metrica__cabecalho"><span>Realizadas</span><span>✔️</span></div>
          <div className="card-metrica__corpo"><span className="numero">{totalRealizadas}</span><span className="legenda">atendidas</span></div>
        </div>
        <div className="card-metrica">
          <div className="card-metrica__cabecalho"><span>Canceladas</span><span>❌</span></div>
          <div className="card-metrica__corpo"><span className="numero">{totalCanceladas}</span><span className="legenda">desmarcadas</span></div>
        </div>
      </div>

      {/* Tabela de Consultas */}
      <div className="tabela-container">
        <div className="tabela-cabecalho-acoes">
          <div className="filtros-grupo">
            {/* Seletor rápido de Período */}
            <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', gap: '3px' }}>
              <button
                type="button"
                onClick={() => selecionarPeriodo('HOJE')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: periodoAtivo === 'HOJE' ? 700 : 500,
                  background: periodoAtivo === 'HOJE' ? '#FFFFFF' : 'transparent',
                  color: periodoAtivo === 'HOJE' ? '#00695C' : '#64748B',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: periodoAtivo === 'HOJE' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                📅 Hoje
              </button>
              <button
                type="button"
                onClick={() => selecionarPeriodo('AMANHA')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: periodoAtivo === 'AMANHA' ? 700 : 500,
                  background: periodoAtivo === 'AMANHA' ? '#FFFFFF' : 'transparent',
                  color: periodoAtivo === 'AMANHA' ? '#00695C' : '#64748B',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: periodoAtivo === 'AMANHA' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Amanhã
              </button>
              <button
                type="button"
                onClick={() => selecionarPeriodo('TODAS')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: periodoAtivo === 'TODAS' ? 700 : 500,
                  background: periodoAtivo === 'TODAS' ? '#FFFFFF' : 'transparent',
                  color: periodoAtivo === 'TODAS' ? '#00695C' : '#64748B',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: periodoAtivo === 'TODAS' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Todas as Datas
              </button>
            </div>

            {/* Filtros de Status */}
            {['Todos', 'Confirmada', 'Agendada', 'Realizada', 'Cancelada'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => definirFiltroStatus(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: filtroStatus === st ? 700 : 500,
                  border: filtroStatus === st ? '1px solid #00695C' : '1px solid #CBD5E1',
                  backgroundColor: filtroStatus === st ? '#E8F5E9' : '#FFFFFF',
                  color: filtroStatus === st ? '#00695C' : '#475569',
                  cursor: 'pointer',
                }}
              >
                {st}
              </button>
            ))}

            {/* Seletor de Médico visível apenas para a Gestão */}
            {ehGestao && (
              <select value={filtroMedico} onChange={(e) => definirFiltroMedico(e.target.value)}>
                <option value="">Todos os Médicos</option>
                {medicos.map((m) => (<option key={m._id} value={m._id}>{m.nome}</option>))}
              </select>
            )}

            <input
              type="date"
              value={filtroData}
              onChange={(e) => {
                definirFiltroData(e.target.value);
                definirPeriodoAtivo('CUSTOM');
              }}
              title="Escolher data específica no calendário"
            />
          </div>

          <input
            type="text"
            placeholder="Filtrar por paciente..."
            value={buscaNome}
            onChange={(e) => definirBuscaNome(e.target.value)}
          />
        </div>

        <table className="tabela-moderna">
          <thead>
            <tr>
              <th>Horário</th>
              <th>Paciente</th>
              <th>{ehGestao ? 'Médico & Especialidade' : 'Especialidade / Detalhes'}</th>
              <th>Data</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>Carregando consultas...</td></tr>
            ) : consultasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                  <p>
                    {ehGestao
                      ? `Nenhuma consulta programada para ${filtroData || 'este filtro'}.`
                      : `Você não possui consultas agendadas para ${filtroData || 'este período'}.`}
                  </p>
                  <div style={{ marginTop: '10px' }}>
                    <button type="button" onClick={() => selecionarPeriodo('TODAS')} className="btn btn-secundario" style={{ fontSize: '12px' }}>
                      Ver Todas as Datas
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              consultasFiltradas.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 800, color: '#0F172A', fontSize: '15px' }}>
                    {c.horario}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{c.paciente?.nome || 'Paciente não identificado'}</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{c.paciente?.telefone}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.doutor?.nome || 'Médico não informado'}</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{c.doutor?.especialidade}</div>
                  </td>
                  <td>{c.data}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      {c.status !== 'Realizada' && (
                        <button
                          type="button"
                          className="btn-icone"
                          title="Iniciar / Finalizar Atendimento"
                          onClick={() => alterarStatusConsulta(c._id, 'Realizada')}
                        >
                          ✔️
                        </button>
                      )}
                      {c.status === 'Agendada' && (
                        <button
                          type="button"
                          className="btn-icone"
                          title="Confirmar Presença"
                          onClick={() => alterarStatusConsulta(c._id, 'Confirmada')}
                        >
                          🟢
                        </button>
                      )}
                      {c.status !== 'Cancelada' && ehGestao && (
                        <button
                          type="button"
                          className="btn-icone"
                          title="Cancelar Consulta"
                          onClick={() => alterarStatusConsulta(c._id, 'Cancelada')}
                        >
                          ❌
                        </button>
                      )}
                      {ehGestao && (
                        <button
                          type="button"
                          className="btn-icone"
                          title="Remarcar / Editar"
                          onClick={() => { definirConsultaEmEdicao(c); definirModalAberto(true); }}
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Agendamento visível apenas para a Gestão */}
      {ehGestao && (
        <AppointmentModal
          aberto={modalAberto}
          aoFechar={() => definirModalAberto(false)}
          aoSalvarSucesso={carregarConsultas}
          consultaParaEditar={consultaEmEdicao}
        />
      )}
    </div>
  );
}
