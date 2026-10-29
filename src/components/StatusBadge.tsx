import React from 'react';
import { StatusAgendamento } from '@/models/Agendamento';

interface PropriedadesStatusBadge {
  status: StatusAgendamento | string;
}

// Retorna a classe CSS correspondente ao status da consulta
function obterClasseStatus(status: string): string {
  const mapeamento: Record<string, string> = {
    Agendada: 'status-badge--agendada',
    Confirmada: 'status-badge--confirmada',
    Realizada: 'status-badge--realizada',
    Cancelada: 'status-badge--cancelada',
  };
  return mapeamento[status] || 'status-badge--agendada';
}

// Retorna o símbolo de indicador visual para o status
function obterSimboloStatus(status: string): string {
  const simbolos: Record<string, string> = {
    Agendada: '⏱️',
    Confirmada: '🟢',
    Realizada: '✔️',
    Cancelada: '❌',
  };
  return simbolos[status] || '•';
}

// Componente para renderização de badges de status coloridos
export function StatusBadge({ status }: PropriedadesStatusBadge) {
  const classeStatus = obterClasseStatus(status);
  const simbolo = obterSimboloStatus(status);

  return (
    <span className={`status-badge ${classeStatus}`}>
      <span style={{ fontSize: '10px' }}>{simbolo}</span>
      <span>{status}</span>
    </span>
  );
}

export default StatusBadge;
