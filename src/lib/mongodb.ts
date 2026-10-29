import mongoose from 'mongoose';

// Estrutura para cache de conexão com o banco de dados no escopo global
interface CacheMongoose {
  conexao: typeof mongoose | null;
  promessa: Promise<typeof mongoose> | null;
}

// Extensão do escopo global do Node.js para preservar conexão no Next.js
declare global {
  // eslint-disable-next-line no-var
  var cacheMongoose: CacheMongoose | undefined;
}

// Inicializa ou reaproveita o cache existente na aplicação
const cacheConexao: CacheMongoose = globalThis.cacheMongoose ?? {
  conexao: null,
  promessa: null,
};

if (!globalThis.cacheMongoose) {
  globalThis.cacheMongoose = cacheConexao;
}

// Recupera a URI do MongoDB com fallback automático para o MongoDB local
function obterUriMongo(): string {
  const uriConfigurada = process.env.MONGODB_URI;
  if (uriConfigurada && uriConfigurada.trim()) {
    return uriConfigurada.trim();
  }
  return 'mongodb://127.0.0.1:27017/agenda_saude_bem_estar';
}

// Inicializa o processo assíncrono de conexão com o Mongoose
async function iniciarConexao(uri: string): Promise<typeof mongoose> {
  return mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  });
}

// Obtém a conexão ativa com o MongoDB aplicando o padrão Singleton
export async function conectarAoBanco(): Promise<typeof mongoose> {
  if (cacheConexao.conexao) {
    return cacheConexao.conexao;
  }

  if (!cacheConexao.promessa) {
    const uri = obterUriMongo();
    cacheConexao.promessa = iniciarConexao(uri);
  }

  try {
    cacheConexao.conexao = await cacheConexao.promessa;
    return cacheConexao.conexao;
  } catch (erro) {
    cacheConexao.promessa = null;
    throw erro;
  }
}

// Alias em inglês mantido para compatibilidade e exportação padrão
export const connectToDatabase = conectarAoBanco;
export default conectarAoBanco;
