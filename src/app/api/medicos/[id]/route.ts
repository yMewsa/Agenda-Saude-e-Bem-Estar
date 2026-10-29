import { NextResponse } from 'next/server';
import { conectarAoBanco } from '@/lib/mongodb';
import { Doutor } from '@/models/Doutor';

interface ParametrosRota {
  params: Promise<{ id: string }>;
}

// Retorna os dados detalhados de um médico pelo ID
export async function GET(_req: Request, { params }: ParametrosRota): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const { id } = await params;
    const doutor = await Doutor.findById(id);

    if (!doutor) {
      return NextResponse.json({ erro: 'Médico não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(doutor);
  } catch {
    return NextResponse.json({ erro: 'Falha ao buscar médico.' }, { status: 500 });
  }
}

// Atualiza nome e especialidade do médico
export async function PUT(requisicao: Request, { params }: ParametrosRota): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const { id } = await params;
    const corpo = await requisicao.json();

    const doutorAtualizado = await Doutor.findByIdAndUpdate(
      id,
      { nome: corpo.nome?.trim(), especialidade: corpo.especialidade?.trim() },
      { new: true, runValidators: true }
    );

    if (!doutorAtualizado) {
      return NextResponse.json({ erro: 'Médico não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(doutorAtualizado);
  } catch {
    return NextResponse.json({ erro: 'Falha ao atualizar médico.' }, { status: 500 });
  }
}

// Remove o médico selecionado da base de dados
export async function DELETE(_req: Request, { params }: ParametrosRota): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const { id } = await params;
    const doutorRemovido = await Doutor.findByIdAndDelete(id);

    if (!doutorRemovido) {
      return NextResponse.json({ erro: 'Médico não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ mensagem: 'Médico removido com sucesso.' });
  } catch {
    return NextResponse.json({ erro: 'Falha ao excluir médico.' }, { status: 500 });
  }
}
