# Guia: Configurar Sincronização com Google Calendar

## Problema Identificado

O erro "Missing authorization header" acontece porque:
1. A tabela `calendar_credentials` não existia no banco
2. As variáveis de ambiente do Google não estão configuradas no Supabase
3. A função estava exigindo autenticação no callback do Google

## Correções Implementadas

✅ **Corrigida a função Edge** - Callback do Google não requer mais autenticação
✅ **Criada a migração** - Tabela `calendar_credentials` será criada
✅ **Documentação completa** - Passo a passo para configurar

## Passo a Passo para Configurar

### 1. Aplicar a Migração no Supabase

Primeiro, você precisa aplicar a nova migração que cria a tabela `calendar_credentials`:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para seu projeto
3. No menu lateral, clique em **"SQL Editor"**
4. Clique em **"New Query"**
5. Cole o conteúdo do arquivo `supabase/migrations/20250917030000_create_calendar_credentials.sql`
6. Clique em **"Run"** para executar

### 2. Configurar Projeto no Google Cloud Console

1. **Acesse o Google Cloud Console:**
   - Vá para [console.cloud.google.com](https://console.cloud.google.com)
   - Faça login com sua conta Google

2. **Criar ou Selecionar Projeto:**
   - Crie um novo projeto ou selecione um existente
   - Anote o nome do projeto

3. **Habilitar Google Calendar API:**
   - No menu lateral, vá para **"APIs & Services" > "Library"**
   - Procure por **"Google Calendar API"**
   - Clique nela e depois em **"Enable"**

4. **Configurar OAuth Consent Screen:**
   - Vá para **"APIs & Services" > "OAuth consent screen"**
   - Escolha **"External"** (para uso público)
   - Preencha as informações obrigatórias:
     - **App name**: Nome do seu aplicativo médico
     - **User support email**: Seu email
     - **Developer contact information**: Seu email
   - Clique em **"Save and Continue"**

5. **Criar Credenciais OAuth:**
   - Vá para **"APIs & Services" > "Credentials"**
   - Clique em **"Create Credentials" > "OAuth 2.0 Client IDs"**
   - Escolha **"Web application"**
   - Configure:
     - **Name**: "App Médico - Calendar Sync"
     - **Authorized redirect URIs**: `https://kmwsoppkrjzjioeadtqb.supabase.co/functions/v1/google-calendar-sync/callback`
   - Clique em **"Create"**
   - **IMPORTANTE**: Anote o **Client ID** e **Client Secret**

### 3. Configurar Variáveis de Ambiente no Supabase

1. **Acesse o Supabase Dashboard:**
   - Vá para [supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecione seu projeto

2. **Configurar Edge Functions:**
   - No menu lateral, clique em **"Edge Functions"**
   - Clique em **"google-calendar-sync"** (se existir) ou crie uma nova
   - Vá para **"Settings"** da função

3. **Adicionar Variáveis de Ambiente:**
   - Clique em **"Environment Variables"**
   - Adicione as seguintes variáveis:

   ```
   GOOGLE_CLIENT_ID=seu_client_id_aqui
   GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
   SUPABASE_URL=https://kmwsoppkrjzjioeadtqb.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
   APP_PUBLIC_URL=https://seu-app.vercel.app
   ```

4. **Obter Service Role Key:**
   - No Supabase, vá para **"Settings" > "API"**
   - Copie a **"service_role"** key (não a anon key)
   - Cole na variável `SUPABASE_SERVICE_ROLE_KEY`

### 4. Fazer Deploy da Função Corrigida

1. **Fazer commit das correções:**
   ```bash
   git add .
   git commit -m "fix: corrigir sincronização Google Calendar"
   git push origin main
   ```

2. **Deploy no Supabase:**
   - Se você tem o Supabase CLI instalado:
   ```bash
   supabase functions deploy google-calendar-sync
   ```
   - Ou faça o deploy manual copiando o código corrigido

### 5. Testar a Sincronização

1. **Acesse seu aplicativo**
2. **Vá para as configurações de calendário**
3. **Clique em "Conectar Google Calendar"**
4. **Autorize o acesso**
5. **Verifique se não há mais erro 401**

## Verificação de Problemas

Se ainda houver problemas, verifique:

1. **Variáveis de ambiente** estão todas configuradas
2. **Redirect URI** está exatamente igual no Google Cloud Console
3. **Migração** foi aplicada corretamente no banco
4. **Função** foi deployada com as correções

## URLs Importantes

- **Callback URL**: `https://kmwsoppkrjzjioeadtqb.supabase.co/functions/v1/google-calendar-sync/callback`
- **Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com)
- **Supabase Dashboard**: [supabase.com/dashboard](https://supabase.com/dashboard)

---

**Após seguir todos esses passos, a sincronização com Google Calendar deve funcionar perfeitamente!**
