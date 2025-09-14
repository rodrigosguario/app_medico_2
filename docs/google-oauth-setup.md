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

### 4. ⚠️ SOLUÇÃO PARA ERRO 403 - ADICIONAR USUÁRIO DE TESTE

**PROBLEMA**: Erro 403 "access_denied" - App não foi verificado pelo Google.
**CAUSA**: App está em modo "Testing" - apenas emails autorizados podem fazer login.

**SOLUÇÃO RÁPIDA - Adicionar Test User:**

1. **Abra** [Google Cloud Console](https://console.cloud.google.com)
2. **Selecione** seu projeto
3. **Vá em** "APIs & Services" → **"OAuth consent screen"**
4. **Role para baixo** até a seção **"Test users"**
5. **Clique em** "ADD USERS"
6. **Digite seu email** exatamente como você usa no Google
7. **Clique** "Save"
8. **Aguarde 1-2 minutos** para propagar
9. **Teste novamente** o login

**SOLUÇÃO ALTERNATIVA - Publicar App (Não Recomendado):**
- Mude de "Testing" para "In production" no OAuth Consent Screen
- ⚠️ Pode exigir verificação do Google (processo longo)

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