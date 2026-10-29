import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { conectarAoBanco } from '@/lib/mongodb';
import { Agendamento } from '@/models/Agendamento';
import { Doutor } from '@/models/Doutor';
import '@/models/Paciente';

// Localiza o identificador do médico autenticado a partir do cabeçalho ou nome
async function identificarIdDoutor(idHeader?: string, nomeHeader?: string) {
  if (idHeader && mongoose.isValidObjectId(idHeader)) {
    return idHeader;
  }
  if (nomeHeader) {
    const doutor = await Doutor.findOne({ nome: new RegExp(nomeHeader, 'i') });
    if (doutor) return doutor._id.toString();
  }
  return null;
}

// Monta o filtro garantindo que o médico consulte estritamente seus próprios agendamentos
async function montarFiltroConsultas(params: URLSearchParams, papel?: string, idDoc?: string, nomeDoc?: string) {
  const filtro: Record<string, unknown> = {};

  if (papel === 'MEDICO') {
    const idIdentificado = await identificarIdDoutor(idDoc, nomeDoc);
    filtro.doutor = idIdentificado || new mongoose.Types.ObjectId();
  } else if (params.get('medico') || params.get('doctorId')) {
    filtro.doutor = params.get('medico') || params.get('doctorId');
  }

  if (params.get('data') || params.get('date')) {
    filtro.data = params.get('data') || params.get('date');
  }

  if (params.get('status')) {
    filtro.status = params.get('status');
  }

  return filtro;
}

// Regra de negócio: verifica duplicidade de horário ativo para o mesmo médico
export async function checarHorarioOcupado(
  idDoutor: string,
  data: string,
  horario: string,
  ignorarId?: string
): Promise<boolean> {
  const filtro: Record<string, unknown> = {
    doutor: idDoutor,
    data,
    horario,
    status: { $ne: 'Cancelada' },
  };
  if (ignorarId) filtro._id = { $ne: ignorarId };
  const consultaExistente = await Agendamento.findOne(filtro);
  return Boolean(consultaExistente);
}

// Lista consultas com isolamento estrito de visibilidade para o perfil Médico
export async function GET(requisicao: Request): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const { searchParams } = new URL(requisicao.url);
    const papel = requisicao.headers.get('x-user-role') || undefined;
    const idMedico = requisicao.headers.get('x-doctor-id') || undefined;
    const nomeMedico = requisicao.headers.get('x-user-name') || undefined;

    const filtro = await montarFiltroConsultas(searchParams, papel, idMedico, nomeMedico);
    const consultas = await Agendamento.find(filtro)
      .populate('paciente', 'nome telefone')
      .populate('doutor', 'nome especialidade')
      .sort({ data: 1, horario: 1 });

    return NextResponse.json(consultas);
  } catch {
    return NextResponse.json({ erro: 'Falha ao buscar consultas.' }, { status: 500 });
  }
}

// Cria uma nova consulta após validar a disponibilidade do médico no horário
export async function POST(requisicao: Request): Promise<NextResponse> {
  try {
    await conectarAoBanco();
    const corpo = await requisicao.json();
    const doutor = corpo.doutor || corpo.doctorId;
    const paciente = corpo.paciente || corpo.patientId;
    const data = corpo.data || corpo.date;
    const horario = corpo.horario || corpo.timeSlot;
    const status = corpo.status || 'Agendada';

    const horarioOcupado = await checarHorarioOcupado(doutor, data, horario);
    if (horarioOcupado) {
      return NextResponse.json(
        { erro: 'O médico já possui um agendamento neste horário.' },
        { status: 400 }
      );
    }

    const novaConsulta = await Agendamento.create({ paciente, doutor, data, horario, status });
    return NextResponse.json(novaConsulta, { status: 201 });
  } catch {
    return NextResponse.json({ erro: 'Falha ao agendar consulta.' }, { status: 500 });
  }
}
