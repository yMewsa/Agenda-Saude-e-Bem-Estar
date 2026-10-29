import mongoose, { Document, Model, Schema, Types } from 'mongoose';
// Importação preventiva dos modelos relacionados para suportar populate no Next.js
import './Paciente';
import './Doutor';
import { IPaciente } from './Paciente';
import { IDoutor } from './Doutor';

// Tipagem dos status permitidos para um agendamento
export type StatusAgendamento =
  | 'Agendada'
  | 'Confirmada'
  | 'Realizada'
  | 'Cancelada';

// Interface com os atributos do agendamento / consulta
export interface IAgendamento {
  paciente: Types.ObjectId | IPaciente;
  doutor: Types.ObjectId | IDoutor;
  data: string; // Formato YYYY-MM-DD
  horario: string; // Formato HH:mm
  status: StatusAgendamento;
  criadoEm?: Date;
  timeSlot?: string; // Suporte a compatibilidade
  createdAt?: Date;
}

// Interface tipada do documento Mongoose para Agendamento
export interface IAgendamentoDocument extends IAgendamento, Document {}

// Definição do Schema Mongoose para Agendamento
const AgendamentoSchema = new Schema<IAgendamentoDocument>(
  {
    paciente: {
      type: Schema.Types.ObjectId,
      ref: 'Paciente',
      required: [true, 'O paciente é obrigatório'],
    },
    doutor: {
      type: Schema.Types.ObjectId,
      ref: 'Doutor',
      required: [true, 'O doutor é obrigatório'],
    },
    data: {
      type: String,
      required: [true, 'A data do agendamento é obrigatória (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato YYYY-MM-DD'],
    },
    horario: {
      type: String,
      required: [true, 'O horário é obrigatório (HH:mm)'],
      match: [/^\d{2}:\d{2}$/, 'O horário deve estar no formato HH:mm'],
    },
    status: {
      type: String,
      enum: {
        values: ['Agendada', 'Confirmada', 'Realizada', 'Cancelada'],
        message: 'Status "{VALUE}" é inválido para o agendamento',
      },
      default: 'Agendada',
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

// Índice composto para otimizar busca e evitar choque de horários na agenda
AgendamentoSchema.index({ doutor: 1, data: 1, horario: 1 }, { unique: false });

// Reutiliza o modelo compilado ou instancia um novo modelo 'Agendamento'
export const Agendamento: Model<IAgendamentoDocument> =
  (mongoose.models.Agendamento as Model<IAgendamentoDocument>) ||
  (mongoose.models.Appointment as Model<IAgendamentoDocument>) ||
  mongoose.model<IAgendamentoDocument>('Agendamento', AgendamentoSchema);

// Aliases para manter compatibilidade com implementações existentes
export const Appointment = Agendamento;
export type IAppointment = IAgendamento;
export type IAppointmentDocument = IAgendamentoDocument;
export type AppointmentStatus = StatusAgendamento;

export default Agendamento;
