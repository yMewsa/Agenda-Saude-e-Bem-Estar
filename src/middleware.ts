import { NextRequest, NextResponse } from 'next/server';
import { verificarToken, PayloadToken } from '@/lib/auth';

// Extrai o token do cookie ou do cabeçalho Authorization
function extrairTokenDaRequisicao(requisicao: NextRequest): string | null {
  const cookieToken = requisicao.cookies.get('token_acesso')?.value;
  if (cookieToken) return cookieToken;

  const cabecalhoAuth = requisicao.headers.get('authorization');
  if (cabecalhoAuth?.startsWith('Bearer ')) {
    return cabecalhoAuth.substring(7).trim();
  }
  return null;
}

// Injeta os dados do usuário autenticado nos cabeçalhos da requisição
function injetarHeadersContexto(payload: PayloadToken, requisicao: NextRequest): Headers {
  const novosHeaders = new Headers(requisicao.headers);
  novosHeaders.set('x-user-id', payload.userId);
  novosHeaders.set('x-user-name', payload.name);
  novosHeaders.set('x-user-role', payload.role);
  if (payload.doctorId) {
    novosHeaders.set('x-doctor-id', payload.doctorId);
  }
  return novosHeaders;
}

// Middleware de autenticação e proteção de rotas com base no token JWT
export async function middleware(requisicao: NextRequest): Promise<NextResponse> {
  const caminho = requisicao.nextUrl.pathname;
  const ehRotaPublica = caminho === '/login' || caminho.startsWith('/api/auth');
  const token = extrairTokenDaRequisicao(requisicao);
  const payload = token ? await verificarToken(token) : null;

  // Se já estiver autenticado e tentar acessar a tela de login, vai para a dashboard
  if (caminho === '/login' && payload) {
    return NextResponse.redirect(new URL('/', requisicao.url));
  }

  if (ehRotaPublica) return NextResponse.next();

  // Se não estiver autenticado e tentar rota de API, retorna 401
  if (!payload && caminho.startsWith('/api/')) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
  }

  // Se não estiver autenticado e tentar acessar qualquer página, redireciona para login
  if (!payload) {
    return NextResponse.redirect(new URL('/login', requisicao.url));
  }

  const headersAtualizados = injetarHeadersContexto(payload, requisicao);
  return NextResponse.next({ request: { headers: headersAtualizados } });
}

// Intercepta páginas e rotas de API, excluindo arquivos estáticos
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
