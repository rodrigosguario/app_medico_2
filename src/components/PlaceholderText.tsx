import React from 'react';

interface PlaceholderTextProps {
  text: string;
  placeholder?: string;
  className?: string;
}

export const PlaceholderText: React.FC<PlaceholderTextProps> = ({ 
  text, 
  placeholder = "Digite aqui...", 
  className = "" 
}) => {
  return (
    <span className={className}>
      {text || placeholder}
    </span>
  );
};

// Utility function to generate better placeholders for medical contexts
export const generatePlaceholder = (field: string): string => {
  const placeholders: Record<string, string> = {
    'token': 'Cole seu token de API aqui (ex: abc123def456...)',
    'webhook': 'URL do webhook Zapier (ex: https://hooks.zapier.com/hooks/catch/...)',
    'hospital': 'Selecione um hospital da lista',
    'specialty': 'Sua especialidade médica (ex: Cardiologia, Ortopedia)',
    'crm': 'Número do CRM/UF (ex: 123456/SP)',
    'phone': 'Telefone profissional (ex: (11) 99999-9999)',
    'value': 'Valor em R$ (ex: 450,00)',
    'patient': 'Nome completo do paciente',
    'description': 'Informações adicionais (opcional)',
    'location': 'Local do atendimento ou procedimento',
    'title': 'Título do evento ou consulta',
    'email': 'Seu e-mail profissional',
    'name': 'Nome completo',
    'password': 'Senha segura (mínimo 6 caracteres)',
    'date': 'Selecione uma data',
    'time': 'Horário (ex: 14:30)',
    'category': 'Selecione uma categoria',
    'amount': 'Valor da transação em R$'
  };
  
  return placeholders[field] || `Digite ${field}`;
};