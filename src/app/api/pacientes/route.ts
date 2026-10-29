import { NextResponse } from 'next/server';
import { conectarAoBanco } from '@/lib/mongodb';
import { Paciente } from '@/models/Paciente';

// Valida os campos obrigatórios do paciente
function validarDadosPaciente(nome?: string, telefone?: string): string | null {
  if (!nome || typeof nome !== 'string' || !nome.trim()) {
    return 'O nome do paciente é obrigatório.';
  }
  if (!telefone || typeof telefone !== 'string' || !telefone.trim()) {
    return 'O telefone do paciente é obrigatório.';
  }
  return null;
}

// Lista os pacientes cadastrados com suporte a busca textual opcional
export async function GET(requisicao: Request): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const { searchParams } = new URL(requisicao.url);
    const termo = searchParams.get('busca') || searchParams.get('termo');

    const filtro = termo
      ? { $or: [{ nome: new RegExp(termo, 'i') }, { telefone: new RegExp(termo, 'i') }] }
      : {};

    const pacientes = await Paciente.find(filtro).sort({ criadoEm: -1 });
    return NextResponse.json(pacientes);
  } catch (erro) {
    return NextResponse.json({ erro: 'Erro ao buscar pacientes.' }, { status: 500 });
  }
}

// Cria um novo registro de paciente no banco de dados
export async function POST(requisicao: Request): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const corpo = await requisicao.json();
    const { nome, telefone } = corpo;

    const erroValidacao = validarDadosPaciente(nome, telefone);
    if (erroValidacao) {
      return NextResponse.json({ erro: erroValidacao }, { status: 400 });
    }

    const novoPaciente = await Paciente.create({
      nome: nome.trim(),
      telefone: telefone.trim(),
    });

    return NextResponse.json(novoPaciente, { status: 201 });
  } catch (erro) {
    return NextResponse.json({ erro: 'Erro ao cadastrar paciente.' }, { status: 500 });
  }
}
