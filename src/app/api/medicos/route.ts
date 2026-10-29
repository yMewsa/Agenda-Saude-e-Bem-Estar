import { NextResponse } from 'next/server';
import { conectarAoBanco } from '@/lib/mongodb';
import { Doutor } from '@/models/Doutor';

// Valida os campos obrigatórios do médico/doutor
function validarDadosDoutor(nome?: string, especialidade?: string): string | null {
  if (!nome || typeof nome !== 'string' || !nome.trim()) {
    return 'O nome do médico é obrigatório.';
  }
  if (!especialidade || typeof especialidade !== 'string' || !especialidade.trim()) {
    return 'A especialidade do médico é obrigatória.';
  }
  return null;
}

// Lista todos os médicos cadastrados ordenados pelo nome
export async function GET(requisicao: Request): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const { searchParams } = new URL(requisicao.url);
    const termo = searchParams.get('busca') || searchParams.get('termo');

    const filtro = termo
      ? { $or: [{ nome: new RegExp(termo, 'i') }, { especialidade: new RegExp(termo, 'i') }] }
      : {};

    const medicos = await Doutor.find(filtro).sort({ nome: 1 });
    return NextResponse.json(medicos);
  } catch {
    return NextResponse.json({ erro: 'Erro ao buscar médicos.' }, { status: 500 });
  }
}

// Cadastra um novo médico com nome e especialidade
export async function POST(requisicao: Request): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const corpo = await requisicao.json();
    const { nome, especialidade } = corpo;

    const erroValidacao = validarDadosDoutor(nome, especialidade);
    if (erroValidacao) {
      return NextResponse.json({ erro: erroValidacao }, { status: 400 });
    }

    const novoDoutor = await Doutor.create({
      nome: nome.trim(),
      especialidade: especialidade.trim(),
    });

    return NextResponse.json(novoDoutor, { status: 201 });
  } catch {
    return NextResponse.json({ erro: 'Erro ao cadastrar médico.' }, { status: 500 });
  }
}
