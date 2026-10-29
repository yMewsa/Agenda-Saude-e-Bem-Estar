import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface que define os atributos da entidade Paciente
export interface IPaciente {
  nome: string;
  telefone: string;
  criadoEm?: Date;
  createdAt?: Date;
}

// Interface tipada do documento Mongoose para Paciente
export interface IPacienteDocument extends IPaciente, Document {}

// Definição do Schema Mongoose para Paciente
const PacienteSchema = new Schema<IPacienteDocument>(
  {
    nome: {
      type: String,
      required: [true, 'O campo nome é obrigatório'],
      trim: true,
    },
    telefone: {
      type: String,
      required: [true, 'O campo telefone é obrigatório'],
      trim: true,
    },
    criadoEm: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'criadoEm', updatedAt: false },
  }
);

// Reutiliza o modelo já compilado ou cria uma nova instância
export const Paciente: Model<IPacienteDocument> =
  (mongoose.models.Paciente as Model<IPacienteDocument>) ||
  (mongoose.models.Patient as Model<IPacienteDocument>) ||
  mongoose.model<IPacienteDocument>('Paciente', PacienteSchema);

export default Paciente;
