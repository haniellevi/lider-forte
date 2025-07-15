import { z } from 'zod';

// Validação de CPF
export const cpfSchema = z
  .string()
  .min(11, 'CPF deve ter 11 dígitos')
  .max(14, 'CPF deve ter no máximo 14 caracteres')
  .refine((cpf) => {
    // Remove pontos e traços
    const cleanCpf = cpf.replace(/[.-]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf[i]) * (10 - i);
    }
    let remainder = sum % 11;
    let firstDigit = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cleanCpf[9]) !== firstDigit) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf[i]) * (11 - i);
    }
    remainder = sum % 11;
    let secondDigit = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(cleanCpf[10]) === secondDigit;
  }, 'CPF inválido');

// Validação de CNPJ
export const cnpjSchema = z
  .string()
  .min(14, 'CNPJ deve ter 14 dígitos')
  .max(18, 'CNPJ deve ter no máximo 18 caracteres')
  .refine((cnpj) => {
    // Remove pontos, traços e barras
    const cleanCnpj = cnpj.replace(/[./-]/g, '');
    
    // Verifica se tem 14 dígitos
    if (cleanCnpj.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCnpj[i]) * weights1[i];
    }
    let remainder = sum % 11;
    let firstDigit = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cleanCnpj[12]) !== firstDigit) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCnpj[i]) * weights2[i];
    }
    remainder = sum % 11;
    let secondDigit = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(cleanCnpj[13]) === secondDigit;
  }, 'CNPJ inválido');

// Validação de CEP
export const cepSchema = z
  .string()
  .min(8, 'CEP deve ter 8 dígitos')
  .max(9, 'CEP deve ter no máximo 9 caracteres')
  .refine((cep) => {
    // Remove traços
    const cleanCep = cep.replace(/-/g, '');
    
    // Verifica se tem 8 dígitos numéricos
    return /^\d{8}$/.test(cleanCep);
  }, 'CEP inválido');

// Validação de telefone brasileiro
export const phoneSchema = z
  .string()
  .min(10, 'Telefone deve ter pelo menos 10 dígitos')
  .max(15, 'Telefone deve ter no máximo 15 caracteres')
  .refine((phone) => {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Verifica se tem 10 ou 11 dígitos (com ou sem 9 no celular)
    if (cleanPhone.length < 10 || cleanPhone.length > 11) return false;
    
    // Verifica se começa com código de área válido (11-99)
    const areaCode = cleanPhone.slice(0, 2);
    const areaCodeNum = parseInt(areaCode);
    if (areaCodeNum < 11 || areaCodeNum > 99) return false;
    
    // Se tem 11 dígitos, verifica se o terceiro dígito é 9 (celular)
    if (cleanPhone.length === 11) {
      return cleanPhone[2] === '9';
    }
    
    // Se tem 10 dígitos, verifica se o terceiro dígito não é 9 (fixo)
    return cleanPhone[2] !== '9';
  }, 'Telefone inválido');

// Validação de email brasileiro com domínios específicos
export const emailBrazilianSchema = z
  .string()
  .email('Email inválido')
  .refine((email) => {
    // Lista de domínios brasileiros comuns
    const brazilianDomains = [
      'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.br',
      'uol.com.br', 'bol.com.br', 'terra.com.br', 'ig.com.br',
      'globo.com', 'r7.com', 'live.com', 'msn.com'
    ];
    
    const domain = email.split('@')[1];
    return brazilianDomains.includes(domain) || domain.endsWith('.br');
  }, 'Email deve ser de um domínio brasileiro');

// Schema para endereço brasileiro
export const addressSchema = z.object({
  street: z.string().min(1, 'Logradouro é obrigatório'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 letras').refine((state) => {
    const brazilianStates = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
      'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
      'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];
    return brazilianStates.includes(state.toUpperCase());
  }, 'Estado inválido'),
  zipCode: cepSchema,
  country: z.string().default('Brasil'),
});

// Schema para dados pessoais brasileiros
export const personalDataSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: cpfSchema,
  rg: z.string().min(7, 'RG deve ter pelo menos 7 caracteres'),
  birthDate: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 0 && age <= 120;
  }, 'Data de nascimento inválida'),
  phone: phoneSchema,
  email: z.string().email('Email inválido'),
  address: addressSchema,
});

// Utilitários para formatação
export const formatCPF = (cpf: string): string => {
  const clean = cpf.replace(/\D/g, '');
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatCNPJ = (cnpj: string): string => {
  const clean = cnpj.replace(/\D/g, '');
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export const formatCEP = (cep: string): string => {
  const clean = cep.replace(/\D/g, '');
  return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
};

export const formatPhone = (phone: string): string => {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};

// Utilitários para limpeza
export const cleanCPF = (cpf: string): string => cpf.replace(/[.-]/g, '');
export const cleanCNPJ = (cnpj: string): string => cnpj.replace(/[./-]/g, '');
export const cleanCEP = (cep: string): string => cep.replace(/-/g, '');
export const cleanPhone = (phone: string): string => phone.replace(/\D/g, '');

// Validação composta para pessoa física
export const personSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: cpfSchema,
  email: z.string().email('Email inválido'),
  phone: phoneSchema,
  address: addressSchema.optional(),
});

// Validação composta para pessoa jurídica
export const companySchema = z.object({
  companyName: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  cnpj: cnpjSchema,
  email: z.string().email('Email inválido'),
  phone: phoneSchema,
  address: addressSchema.optional(),
});

// Validação para dados bancários brasileiros
export const bankDataSchema = z.object({
  bankCode: z.string().length(3, 'Código do banco deve ter 3 dígitos'),
  agency: z.string().min(4, 'Agência deve ter pelo menos 4 dígitos'),
  account: z.string().min(5, 'Conta deve ter pelo menos 5 dígitos'),
  accountType: z.enum(['corrente', 'poupanca'], {
    errorMap: () => ({ message: 'Tipo de conta deve ser corrente ou poupança' })
  }),
  pixKey: z.string().optional(),
});

export type BrazilianAddress = z.infer<typeof addressSchema>;
export type BrazilianPersonalData = z.infer<typeof personalDataSchema>;
export type BrazilianPerson = z.infer<typeof personSchema>;
export type BrazilianCompany = z.infer<typeof companySchema>;
export type BrazilianBankData = z.infer<typeof bankDataSchema>;