'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IPaciente } from '@/models/Paciente';
import { IDoutor } from '@/models/Doutor';
import { IAgendamento, StatusAgendamento } from '@/models/Agendamento';

interface PropriedadesModal {
  aberto: boolean;
  aoFechar: () => void;
  aoSalvarSucesso: () => void;
  consultaParaEditar?: (IAgendamento & { _id?: string }) | null;
}

const GRADE_HORARIOS_PADRAO = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00'
];

export function AppointmentModal({ aberto, aoFechar, aoSalvarSucesso, consultaParaEditar }: PropriedadesModal) {
  const [pacientes, definirPacientes] = useState<(IPaciente & { _id: string })[]>([]);
  const [doutores, definirDoutores] = useState<(IDoutor & { _id: string })[]>([]);
  const [pacienteId, definirPacienteId] = useState('');
  const [doutorId, definirDoutorId] = useState('');
  const [data, definirData] = useState(() => new Date().toISOString().split('T')[0]);
  const [horario, definirHorario] = useState('09:00');
  const [status, definirStatus] = useState<StatusAgendamento>('Agendada');
  const [horariosOcupados, definirHorariosOcupados] = useState<string[]>([]);
  const [salvando, definirSalvando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState<string | null>(null);

  // Carrega a listagem de pacientes e médicos do banco de dados
  const carregarCadastros = useCallback(async () => {
    try {
      const [respPacientes, respMedicos] = await Promise.all([
        fetch('/api/pacientes').then((r) => r.json()),
        fetch('/api/medicos').then((r) => r.json()),
      ]);
      if (Array.isArray(respPacientes)) definirPacientes(respPacientes);
      if (Array.isArray(respMedicos)) definirDoutores(respMedicos);
    } catch {
      definirMensagemErro('Erro ao carregar dados de médicos e pacientes.');
    }
  }, []);

  // Busca em tempo real a grade de horários ocupados para o médico e data selecionados
  const verificarHorariosOcupados = useCallback(async (idMedico: string, dataConsulta: string) => {
    if (!idMedico || !dataConsulta) return;
    try {
      const resp = await fetch(`/api/consultas?medico=${idMedico}&data=${dataConsulta}`);
      const consultas: (IAgendamento & { _id: string })[] = await resp.json();
      if (Array.isArray(consultas)) {
        const ocupados = consultas
          .filter((c) => c.status !== 'Cancelada' && c._id !== consultaParaEditar?._id)
          .map((c) => c.horario);
        definirHorariosOcupados(ocupados);
      }
    } catch {
      definirHorariosOcupados([]);
    }
  }, [consultaParaEditar]);

  useEffect(() => {
    if (aberto) carregarCadastros();
  }, [aberto, carregarCadastros]);

  useEffect(() => {
    if (doutorId && data) verificarHorariosOcupados(doutorId, data);
  }, [doutorId, data, verificarHorariosOcupados]);

  // Preenche dados ao editar ou reseta ao abrir para novo agendamento
  useEffect(() => {
    if (consultaParaEditar) {
      const idPac = typeof consultaParaEditar.paciente === 'object' ? (consultaParaEditar.paciente as { _id?: string })._id : consultaParaEditar.paciente;
      const idDoc = typeof consultaParaEditar.doutor === 'object' ? (consultaParaEditar.doutor as { _id?: string })._id : consultaParaEditar.doutor;
      definirPacienteId(String(idPac || ''));
      definirDoutorId(String(idDoc || ''));
      definirData(consultaParaEditar.data);
      definirHorario(consultaParaEditar.horario);
      definirStatus(consultaParaEditar.status);
    } else {
      definirMensagemErro(null);
    }
  }, [consultaParaEditar]);

  // Valida e envia o agendamento para a API REST
  const lidarComEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (horariosOcupados.includes(horario)) {
      definirMensagemErro('O médico já possui um agendamento neste horário.');
      return;
    }
    definirSalvando(true);
    definirMensagemErro(null);
    try {
      const url = consultaParaEditar?._id ? `/api/consultas/${consultaParaEditar._id}` : '/api/consultas';
      const metodo = consultaParaEditar?._id ? 'PUT' : 'POST';
      const resposta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente: pacienteId, doutor: doutorId, data, horario, status }),
      });
      const resultado = await resposta.json();
      if (!resposta.ok) {
        definirMensagemErro(resultado.erro || 'Falha ao salvar agendamento.');
        return;
      }
      aoSalvarSucesso();
      aoFechar();
    } catch {
      definirMensagemErro('Erro de conexão ao salvar consulta.');
    } finally {
      definirSalvando(false);
    }
  };

  if (!aberto) return null;
  const estaOcupado = horariosOcupados.includes(horario);

  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div className="modal-conteudo" onClick={(e) => e.stopPropagation()} style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
              {consultaParaEditar ? 'Remarcar / Editar Consulta' : 'Novo Agendamento de Consulta'}
            </h2>
            <p style={{ fontSize: '12px', color: '#64748B' }}>Validação em tempo real de disponibilidade de agenda</p>
          </div>
          <button onClick={aoFechar} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        {mensagemErro && (
          <div style={{ padding: '12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>
            {mensagemErro}
          </div>
        )}

        <form onSubmit={lidarComEnvio}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Paciente *</label>
              <select value={pacienteId} onChange={(e) => definirPacienteId(e.target.value)} required style={{ width: '100%' }}>
                <option value="">Selecione o paciente...</option>
                {pacientes.map((p) => (<option key={p._id} value={p._id}>{p.nome} - {p.telefone}</option>))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Médico Responsável *</label>
              <select value={doutorId} onChange={(e) => definirDoutorId(e.target.value)} required style={{ width: '100%' }}>
                <option value="">Selecione o médico...</option>
                {doutores.map((d) => (<option key={d._id} value={d._id}>{d.nome} ({d.especialidade})</option>))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Data da Consulta *</label>
              <input type="date" value={data} onChange={(e) => definirData(e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Status *</label>
              <select value={status} onChange={(e) => definirStatus(e.target.value as StatusAgendamento)} style={{ width: '100%' }}>
                <option value="Agendada">Agendada</option>
                <option value="Confirmada">Confirmada</option>
                <option value="Realizada">Realizada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
              Grade de Horários Disponíveis (Intervalo de 30 min)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '8px' }}>
              {GRADE_HORARIOS_PADRAO.map((slot) => {
                const ocupado = horariosOcupados.includes(slot);
                const selecionado = horario === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => { definirHorario(slot); definirMensagemErro(null); }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: selecionado ? '2px solid #00695C' : ocupado ? '1px solid #FECACA' : '1px solid #CBD5E1',
                      background: selecionado ? '#00695C' : ocupado ? '#FEE2E2' : '#FFFFFF',
                      color: selecionado ? '#FFFFFF' : ocupado ? '#B91C1C' : '#0F172A',
                      fontWeight: selecionado || ocupado ? 700 : 500,
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div>{slot}</div>
                    <div style={{ fontSize: '9px', opacity: 0.9 }}>
                      {selecionado ? 'ESCOLHIDO' : ocupado ? 'Ocupado' : 'Livre'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {estaOcupado && (
            <div style={{ padding: '10px 14px', background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '8px', color: '#BE123C', fontSize: '12px', marginBottom: '16px', fontWeight: 600 }}>
              ⚠️ Prevenção de Duplicidade Ativa: O médico já possui um agendamento ativo neste horário nesta data.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={aoFechar} className="btn btn-secundario">Cancelar</button>
            <button type="submit" disabled={salvando || estaOcupado} className="btn btn-primario">
              {salvando ? 'Salvando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AppointmentModal;
