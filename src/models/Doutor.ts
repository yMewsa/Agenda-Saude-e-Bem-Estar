import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface que defin os atributos da entidade Doutor
export interface IDoutor {
  nome: string;
  especialidade: string;
  criadoEm?: Date;
  createdAt?: Date;
}

// Interface tipada do documeto Mongoose para Doutor
export interface IDoutorDocument extends IDoutor, Document { }

// Definição do Schema Mongoose para Doutor
const DoutorSchema = new Schema<IDoutorDocument>(
  {
    nome: {
      type: String,
      required: [true, 'O campo nome é obrigatório'],
      trim: true,
    },
    especialidade: {
      type: String,
      required: [true, 'O campo especialidade é obrigatório'],
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

// Reutiliza o modelo compilado ou instancia um novo modelo 'Doutor'
export const Doutor: Model<IDoutorDocument> =
  (mongoose.models.Doutor as Model<IDoutorDocument>) ||
  (mongoose.models.Doctor as Model<IDoutorDocument>) ||
  mongoose.model<IDoutorDocument>('Doutor', DoutorSchema);

// Alias para compatibilidade
export const Doctor = Doutor;
export type IDoctor = IDoutor;
export type IDoctorDocument = IDoutorDocument;

export default Doutor;
