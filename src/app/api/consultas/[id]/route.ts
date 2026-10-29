import { NextResponse } from 'next/server';
import { conectarAoBanco } from '@/lib/mongodb';
import { Agendamento } from '@/models/Agendamento';
import { checarHorarioOcupado } from '../route';
import '@/models/Paciente';
import '@/models/Doutor';

interface ParametrosRota {
  params: Promise<{ id: string }>;
}

// Obtém os dados completos de uma consulta específica
export async function GET(_req: Request, { params }: ParametrosRota): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const { id } = await params;
    const consulta = await Agendamento.findById(id)
      .populate('paciente', 'nome telefone')
      .populate('doutor', 'nome especialidade');

    if (!consulta) {
      return NextResponse.json({ erro: 'Consulta não encontrada.' }, { status: 404 });
    }
    return NextResponse.json(consulta);
  } catch {
    return NextResponse.json({ erro: 'Falha ao buscar consulta.' }, { status: 500 });
  }
}

// Remarca ou edita os dados da consulta validando conflito de horário
export async function PUT(requisicao: Request, { params }: ParametrosRota): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const { id } = await params;
    const corpo = await requisicao.json();
    const doutor = corpo.doutor || corpo.doctorId;
    const data = corpo.data || corpo.date;
    const horario = corpo.horario || corpo.timeSlot;

    const conflito = await checarHorarioOcupado(doutor, data, horario, id);
    if (conflito) {
      return NextResponse.json(
        { erro: 'O médico já possui um agendamento neste horário.' },
        { status: 400 }
      );
    }

    const atualizada = await Agendamento.findByIdAndUpdate(id, corpo, { new: true });
    return NextResponse.json(atualizada);
  } catch {
    return NextResponse.json({ erro: 'Falha ao atualizar consulta.' }, { status: 500 });
  }
}

// Atualiza rapidamente o status da consulta (ex: Confirmada, Realizada, Cancelada)
export async function PATCH(requisicao: Request, { params }: ParametrosRota): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const { id } = await params;
    const { status } = await requisicao.json();

    const atualizada = await Agendamento.findByIdAndUpdate(id, { status }, { new: true });
    if (!atualizada) {
      return NextResponse.json({ erro: 'Consulta não encontrada.' }, { status: 404 });
    }
    return NextResponse.json(atualizada);
  } catch {
    return NextResponse.json({ erro: 'Falha ao alterar status.' }, { status: 500 });
  }
}

// Cancela ou remove a consulta do sistema
export async function DELETE(_req: Request, { params }: ParametrosRota): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const { id } = await params;
    const removida = await Agendamento.findByIdAndDelete(id);

    if (!removida) {
      return NextResponse.json({ erro: 'Consulta não encontrada.' }, { status: 404 });
    }
    return NextResponse.json({ mensagem: 'Consulta removida com sucesso.' });
  } catch {
    return NextResponse.json({ erro: 'Falha ao excluir consulta.' }, { status: 500 });
  }
}
