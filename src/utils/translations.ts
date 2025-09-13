// Translation utilities for the application
export const translations = {
  auth: {
    'Invalid login credentials': 'Credenciais de login inválidas',
    'User not found': 'Usuário não encontrado',
    'Wrong password': 'Senha incorreta',
    'Email not confirmed': 'E-mail não confirmado',
    'Sign up to create an account': 'Cadastre-se para criar uma conta',
    'Sign in to your account': 'Entre na sua conta',
    'Email': 'E-mail',
    'Password': 'Senha',
    'Sign in': 'Entrar',
    'Sign up': 'Cadastrar',
    'Logout': 'Sair',
    'Profile': 'Perfil',
    'Settings': 'Configurações'
  },
  common: {
    'Loading...': 'Carregando...',
    'Save': 'Salvar',
    'Cancel': 'Cancelar',
    'Delete': 'Excluir',
    'Edit': 'Editar',
    'Create': 'Criar',
    'Update': 'Atualizar',
    'Search': 'Pesquisar',
    'Filter': 'Filtrar',
    'Export': 'Exportar',
    'Import': 'Importar',
    'Success': 'Sucesso',
    'Error': 'Erro',
    'Warning': 'Aviso',
    'Info': 'Informação'
  },
  calendar: {
    'New Event': 'Novo Evento',
    'Edit Event': 'Editar Evento',
    'Delete Event': 'Excluir Evento',
    'Event created successfully': 'Evento criado com sucesso',
    'Event updated successfully': 'Evento atualizado com sucesso',
    'Event deleted successfully': 'Evento excluído com sucesso',
    'No events for this date': 'Nenhum evento para esta data',
    'Add Event': 'Adicionar Evento'
  },
  financial: {
    'Add Transaction': 'Adicionar Transação',
    'Edit Transaction': 'Editar Transação',
    'Delete Transaction': 'Excluir Transação',
    'Transaction created successfully': 'Transação criada com sucesso',
    'Transaction updated successfully': 'Transação atualizada com sucesso',
    'Transaction deleted successfully': 'Transação excluída com sucesso'
  }
};

// Function to translate text
export const t = (key: string): string => {
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
};

// Function to translate auth errors specifically
export const translateAuthError = (error: string): string => {
  return translations.auth[error as keyof typeof translations.auth] || error;
};