import { NextResponse } from 'next/server';
import { conectarAoBanco } from '@/lib/mongodb';
import { Paciente } from '@/models/Paciente';

interface ParametrosRota {
  params: Promise<{ id: string }>;
}

// Busca os detalhes de um paciente específico pelo identificador
export async function GET(_req: Request, { params }: ParametrosRota): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const { id } = await params;
    const paciente = await Paciente.findById(id);

    if (!paciente) {
      return NextResponse.json({ erro: 'Paciente não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(paciente);
  } catch {
    return NextResponse.json({ erro: 'Falha ao obter paciente.' }, { status: 500 });
  }
}

// Atualiza as informações cadastrais de um paciente
export async function PUT(requisicao: Request, { params }: ParametrosRota): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const { id } = await params;
    const corpo = await requisicao.json();

    const pacienteAtualizado = await Paciente.findByIdAndUpdate(
      id,
      { nome: corpo.nome?.trim(), telefone: corpo.telefone?.trim() },
      { new: true, runValidators: true }
    );

    if (!pacienteAtualizado) {
      return NextResponse.json({ erro: 'Paciente não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(pacienteAtualizado);
  } catch {
    return NextResponse.json({ erro: 'Falha ao atualizar paciente.' }, { status: 500 });
  }
}

// Remove permanentemente o registro do paciente do banco de dados
export async function DELETE(_req: Request, { params }: ParametrosRota): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const { id } = await params;
    const pacienteRemovido = await Paciente.findByIdAndDelete(id);

    if (!pacienteRemovido) {
      return NextResponse.json({ erro: 'Paciente não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ mensagem: 'Paciente removido com sucesso.' });
  } catch {
    return NextResponse.json({ erro: 'Falha ao excluir paciente.' }, { status: 500 });
  }
}
