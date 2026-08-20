export type QuestionType =
  | "text"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "scale_1_10"
  | "date"
  | "number";

export interface QuestionOption {
  label: string;
  value: string;
}

export interface QuestionItem {
  id: string;
  label: string;
  type: QuestionType;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For radio, select, checkbox
  helpText?: string;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  questions: QuestionItem[];
}

export interface AnamnesisTemplateData {
  id: string;
  title: string;
  description: string;
  version: number;
  isActive: boolean;
  sections: FormSection[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    submissions: number;
  };
}

export interface PatientData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  cpf: string;
  gender?: string;
  occupation?: string;
  maritalStatus?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionData {
  id: string;
  patientId: string;
  patient: PatientData;
  templateId: string;
  templateTitle?: string;
  template?: {
    id: string;
    title: string;
    version: number;
  };
  templateVersion: number;
  templateSnapshot: FormSection[];
  answers: Record<string, any>;
  chiefComplaint?: string;
  status: "pending" | "in_review" | "approved" | "archived";
  clinicalNotes?: string;
  lgpdConsent?: boolean;
  lgpdConsentAt?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  contracts?: ContractData[];
}

export type ContractStatus =
  | "rascunho"
  | "gerado"
  | "aguardando_assinatura"
  | "assinado_recebido"
  | "aprovado"
  | "recusado";

export interface ContractEvent {
  id: string;
  contractId: string;
  fromStatus: string;
  toStatus: string;
  note?: string | null;
  createdAt: string;
}

export interface ContractData {
  id: string;
  patientId: string;
  patient?: PatientData;
  submissionId?: string | null;
  title: string;
  status: ContractStatus;

  // Contratada
  therapistName: string;
  therapistCpfCnpj: string;
  therapistAddress: string;
  therapistPhone: string;
  professionalDocType: string;
  professionalDocNumber: string;

  // Contratante snapshot
  patientFullName: string;
  patientNationality: string;
  patientMaritalStatus: string;
  patientOccupation: string;
  patientRg: string;
  patientCpf: string;
  patientAddress: string;

  // Objeto
  serviceType: string;
  modalidade: string;
  abordagem: string;

  // Sessoes
  durationMinutes: number;
  frequency: string;
  cancellationHours: number;
  initialSessionsCount: number;

  // Pagamento em centavos
  sessionPriceCents: number;
  evaluationPriceCents?: number | null;
  paymentDueDay: number;
  lateFeePercent: number;
  lateInterestPercent: number;
  paymentMethod: string;

  // Vigencia
  rescissionNoticeDays: number;

  // Foro
  foroCidade: string;

  // Testemunhas
  hasWitnesses: boolean;
  witness1Name?: string | null;
  witness1Cpf?: string | null;
  witness2Name?: string | null;
  witness2Cpf?: string | null;

  // Clausulas extras
  customClauses?: string | null;

  // Arquivo assinado
  signedFileKey?: string | null;
  signedFileHash?: string | null;
  signedFileSizeBytes?: number | null;
  signedFileUploadedAt?: string | null;
  signedVersion: number;

  // Decisao
  decisionAt?: string | null;
  refusalReason?: string | null;

  createdAt: string;
  updatedAt: string;

  // Historico de transicoes (apenas no GET /[id])
  events?: ContractEvent[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string;
  crp: string;
  phone: string;
  notificationEmail: string;
  clinicName: string;
  address: string;
}
