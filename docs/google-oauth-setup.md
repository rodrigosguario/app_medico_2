# Configuração Google OAuth - Resolução do Erro 400

## ❌ Problema Atual
**Error 400: Solicitação inválida** - Isso acontece porque:
1. Client ID está como placeholder (`YOUR_GOOGLE_CLIENT_ID`)
2. Domínios não autorizados no Google Cloud Console
3. Configuração OAuth incompleta

## ✅ Solução Completa

### 1. Configure o Google Cloud Console

1. **Acesse**: [Google Cloud Console](https://console.cloud.google.com)
2. **Crie/Selecione** um projeto
3. **Ative** a Google Calendar API:
   - Vá em **APIs & Services** > **Library**
   - Busque "Google Calendar API" e ative

4. **Configure OAuth Consent Screen**:
   - Vá em **APIs & Services** > **OAuth consent screen**
   - Escolha **External** (para usuários fora da organização)
   - Preencha nome do app, email de suporte
   - Adicione domínios autorizados:
     - `f718139e-0921-4562-b04f-6519c248b00c.sandbox.lovable.dev`
     - `app-medico-2.vercel.app` (se usando Vercel)

5. **Crie Credentials**:
   - Vá em **APIs & Services** > **Credentials**
   - Clique **Create Credentials** > **OAuth 2.0 Client ID**
   - Tipo: **Web application**
   
   **Authorized JavaScript origins:**
   ```
   https://f718139e-0921-4562-b04f-6519c248b00c.sandbox.lovable.dev
   https://app-medico-2.vercel.app
   http://localhost:8080
   ```
   
   **Authorized redirect URIs:**
   ```
   https://f718139e-0921-4562-b04f-6519c248b00c.sandbox.lovable.dev
   https://app-medico-2.vercel.app
   http://localhost:8080
   ```

### 2. 🔑 Obtenha e Configure o Client ID

Após criar as credentials, você receberá um **Client ID** similar a:
```
1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

**Configure no código:**
1. Abra `src/hooks/useCalendarSync.ts`
2. Substitua na linha ~32:
   ```javascript
   const clientId = "SEU_CLIENT_ID_AQUI.apps.googleusercontent.com";
   ```

### 3. 🧪 Teste a Configuração

1. Reinicie a aplicação
2. Tente conectar o Google Calendar
3. Se der erro, verifique os logs no console do navegador

### 4. 📋 Configure Usuários de Teste

**IMPORTANTE**: Aplicações Google OAuth começam em modo "Testing" por padrão.

1. **Vá em OAuth Consent Screen**
2. **Na seção "Test users"**, clique **"ADD USERS"**
3. **Adicione seu email** (o mesmo que você usa para testar)
4. **Salve as alterações**

**OU para uso público:**
1. **Mude o status para "In production"**
2. **Isso pode exigir verificação do Google** para alguns escopos

### 5. 🔧 Troubleshooting

**Se der erro 400 (invalid_request):**
- Verifique se o Client ID foi copiado corretamente
- Confirme que os domínios estão exatamente como listados acima
- Aguarde alguns minutos para as mudanças propagarem
- Teste em modo incógnito do navegador

**Se der erro 403 (access_denied) - "Acesso bloqueado":**
- Adicione seu email como usuário de teste (seção acima)
- OU mude o app para "In production" no OAuth Consent Screen
- Aguarde alguns minutos e tente novamente

**Logs úteis:**
- Abra o console do navegador (F12)
- Procure por mensagens que começam com 🔑, ❌, ✅

### 5. 📚 Links Úteis

- [Google OAuth Setup](https://developers.google.com/identity/oauth2/web/setup)
- [Google Calendar API Quickstart](https://developers.google.com/calendar/api/quickstart/js)
- [OAuth Consent Screen](https://support.google.com/cloud/answer/10311615)