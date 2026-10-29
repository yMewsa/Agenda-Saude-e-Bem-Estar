import { NextResponse } from 'next/server';
import { assinarToken, verificarToken, PayloadToken } from '@/lib/auth';
import { conectarAoBanco } from '@/lib/mongodb';
import { Doutor } from '@/models/Doutor';

// Obtém o registro real do médico no MongoDB para vincular ao JWT
async function obterMedicoReal(idOuNome?: string) {
  await conectarAoBanco();
  if (idOuNome && idOuNome !== 'MEDICO') {
    const porId = await Doutor.findById(idOuNome).catch(() => null);
    if (porId) return porId;
    const porNome = await Doutor.findOne({ nome: new RegExp(idOuNome, 'i') });
    if (porNome) return porNome;
  }
  return Doutor.findOne().sort({ criadoEm: 1 });
}

// Constrói o payload com as credenciais reais do usuário
async function construirPayload(papel?: string, email?: string, idMedico?: string): Promise<PayloadToken> {
  const emailNorm = (email || '').toLowerCase().trim();
  const papelNorm = (papel || '').toUpperCase().trim();
  const ehMedico = emailNorm.includes('medico') || emailNorm.includes('marcelo') || papelNorm === 'MEDICO';

  if (ehMedico) {
    const doutor = await obterMedicoReal(idMedico || email);
    return {
      userId: doutor ? doutor._id.toString() : 'usuario_med_01',
      name: doutor ? doutor.nome : 'Médico Plantonista',
      role: 'MEDICO',
      doctorId: doutor ? doutor._id.toString() : undefined,
    };
  }

  return {
    userId: 'usuario_gestor_01',
    name: 'Lari Gestora',
    role: 'GESTOR',
  };
}

// Configura o cookie HTTP-only contendo o token JWT assinado
function criarRespostaComCookie(token: string, usuario: PayloadToken): NextResponse {
  const resposta = NextResponse.json({ sucesso: true, token, usuario });
  resposta.cookies.set('token_acesso', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  });
  return resposta;
}

// Rota POST para autenticação com emissão de token contendo o doctorId real
export async function POST(requisicao: Request): Promise<NextResponse> {
  try {
    const corpo = await requisicao.json();
    const { email, senha, papel, role, doctorId, medicoId } = corpo;

    if (email && !senha) {
      return NextResponse.json({ erro: 'Informe a senha de acesso.' }, { status: 400 });
    }

    const payload = await construirPayload(papel || role, email, doctorId || medicoId);
    const token = await assinarToken(payload);
    return criarRespostaComCookie(token, payload);
  } catch {
    return NextResponse.json({ erro: 'Falha no processamento do login.' }, { status: 500 });
  }
}

// Rota GET para validar a sessão JWT ativa a partir do cookie
export async function GET(requisicao: Request): Promise<NextResponse> {
  const cookieCabecalho = requisicao.headers.get('cookie') || '';
  const correspondencia = cookieCabecalho.match(/token_acesso=([^;]+)/);
  const token = correspondencia ? correspondencia[1] : null;

  if (!token) return NextResponse.json({ autenticado: false }, { status: 401 });
  const payload = await verificarToken(token);
  if (!payload) return NextResponse.json({ autenticado: false }, { status: 401 });

  return NextResponse.json({ autenticado: true, usuario: payload });
}
