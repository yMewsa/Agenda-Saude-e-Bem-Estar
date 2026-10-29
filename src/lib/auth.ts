import { jwtVerify, SignJWT } from 'jose';

// Tipagem dos perfis de acesso aceitos no sistema (Gestor, Médico e Recepção)
export type PapelUsuario = 'GESTOR' | 'MEDICO' | 'RECEPCIONISTA';

// Interface do payload contido no token JWT conforme solicitado
export interface PayloadToken {
  userId: string;
  name: string;
  role: PapelUsuario;
  doctorId?: string;
}

// Chave padrão utilizada caso a variável de ambiente não esteja configurada
const SEGREDO_PADRAO = 'chave-secreta-agenda-saude-bem-estar-dev-2026';

// Converte a chave secreta em formato Uint8Array para uso com a biblioteca jose
function obterChaveSecreta(): Uint8Array {
  const chaveTexto = process.env.JWT_SECRET || SEGREDO_PADRAO;
  return new TextEncoder().encode(chaveTexto);
}

// Gera e assina digitalmente um token JWT com expiração de 8 horas
export async function assinarToken(dadosUsuario: PayloadToken): Promise<string> {
  const chave = obterChaveSecreta();
  return new SignJWT({ ...dadosUsuario })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(chave);
}

// Valida a assinatura do token e extrai o payload decodificado
export async function verificarToken(token: string): Promise<PayloadToken | null> {
  try {
    const chave = obterChaveSecreta();
    const { payload } = await jwtVerify(token, chave);
    return payload as unknown as PayloadToken;
  } catch {
    return null;
  }
}

// Extrai o token a partir do cabeçalho de autorização ou de cookies
export function extrairTokenRequisicao(cabecalhoAutorizacao?: string | null): string | null {
  if (!cabecalhoAutorizacao || !cabecalhoAutorizacao.startsWith('Bearer ')) {
    return null;
  }
  return cabecalhoAutorizacao.substring(7).trim();
}
