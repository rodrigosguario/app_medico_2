# Configuração de Sincronização de Calendários

Este documento descreve como configurar as integrações de calendário para o MedicoAgenda.

## Google Calendar

### 1. Configurar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google Calendar:
   - Navegue para "APIs & Services" > "Library"
   - Procure por "Google Calendar API"
   - Clique em "Enable"

### 2. Configurar OAuth 2.0

1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth client ID"
3. Configure:
   - Application type: Web application
   - Name: MedicoAgenda
   - Authorized JavaScript origins: `https://seu-dominio.com`
   - Authorized redirect URIs: `https://seu-dominio.com/auth/callback`

### 3. Configurar Consent Screen

1. Vá para "APIs & Services" > "OAuth consent screen"
2. Configure as informações do aplicativo
3. Adicione os scopes necessários:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`

## Microsoft Outlook/Graph

### 1. Registrar Aplicação no Azure Portal

1. Acesse [Azure Portal](https://portal.azure.com/)
2. Navegue para "Azure Active Directory" > "App registrations"
3. Clique em "New registration"
4. Configure:
   - Name: MedicoAgenda
   - Supported account types: Accounts in any organizational directory and personal Microsoft accounts
   - Redirect URI: Web - `https://seu-dominio.com/auth/callback`

### 2. Configurar Permissões

1. Vá para "API permissions"
2. Clique em "Add a permission"
3. Selecione "Microsoft Graph"
4. Adicione as permissões:
   - `Calendars.ReadWrite` (Delegated)
   - `User.Read` (Delegated)

### 3. Criar Client Secret

1. Vá para "Certificates & secrets"
2. Clique em "New client secret"
3. Adicione uma descrição e defina expiração
4. Copie o valor do secret (apenas visível uma vez)

## Configuração no Supabase

### Adicionar Secrets

Configure as seguintes secrets no Supabase:

```bash
# Google Calendar
GOOGLE_CLIENT_ID=seu_client_id_google
GOOGLE_CLIENT_SECRET=seu_client_secret_google

# Microsoft Graph
MICROSOFT_CLIENT_ID=seu_client_id_microsoft
MICROSOFT_CLIENT_SECRET=seu_client_secret_microsoft
```

### URLs de Callback

Configure as URLs de callback no Supabase Auth:
- Google: `https://accounts.google.com/o/oauth2/auth`
- Microsoft: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`

## Fluxo de Autenticação

### Google Calendar

1. Usuário clica em "Conectar Google Calendar"
2. Aplicação redireciona para Google OAuth
3. Usuário autoriza acesso
4. Google redireciona de volta com código de autorização
5. Aplicação troca código por access token
6. Token é armazenado seguramente no Supabase

### Microsoft Outlook

1. Usuário clica em "Conectar Outlook"
2. Aplicação redireciona para Microsoft OAuth
3. Usuário autoriza acesso
4. Microsoft redireciona de volta com código
5. Aplicação troca código por access token
6. Token é armazenado seguramente no Supabase

## Sincronização

### Tipos de Sincronização

- **Import**: Importa eventos do calendário externo para o MedicoAgenda
- **Export**: Exporta eventos do MedicoAgenda para o calendário externo
- **Bidirectional**: Sincronização em ambas as direções

### Frequência

- Sincronização automática a cada 60 minutos (configurável)
- Sincronização manual disponível
- Webhooks para notificações em tempo real (futuro)

## Troubleshooting

### Erros Comuns

1. **Invalid redirect URI**: Verifique se a URL de callback está corretamente configurada
2. **Scope insufficient**: Certifique-se que todos os scopes necessários foram aprovados
3. **Token expired**: Implemente refresh de tokens automaticamente

### Debug

- Verifique logs no Supabase Edge Functions
- Use ferramentas de desenvolvedor do navegador
- Monitore requests na aba Network

## Segurança

- Tokens são armazenados criptografados no Supabase
- Refresh tokens são usados para renovar access tokens
- Implementar rate limiting nas APIs
- Validar todos os dados de entrada

## Limitações

- Google Calendar API: 1.000.000 requests/dia
- Microsoft Graph API: Varia por tenant
- Supabase Edge Functions: 500.000 invocations/mês (plano gratuito)

## Roadmap

- [ ] Implementar webhooks para notificações em tempo real
- [ ] Adicionar suporte ao Apple iCloud Calendar
- [ ] Implementar sincronização incremental
- [ ] Cache inteligente para reduzir chamadas de API
- [ ] Interface para gerenciar múltiplas contas do mesmo provedor