import { NextResponse } from 'next/server';

// Rota POST para encerrar a sessão do usuário removendo o cookie JWT
export async function POST(): Promise<NextResponse> {
  const resposta = NextResponse.json({
    sucesso: true,
    mensagem: 'Sessão encerrada com sucesso.',
  });

  resposta.cookies.set('token_acesso', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return resposta;
}
