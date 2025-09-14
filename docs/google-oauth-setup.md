# Configuração Google OAuth - Resolução do Erro de Verificação

## Problema
O erro "Acesso bloqueado: o app app-medico-2.vercel.app não concluiu o processo de verificação do Google" ocorre quando os domínios não estão autorizados no Google Cloud Console.

## Solução

### 1. Configure no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Vá em **APIs & Services** > **Credentials**
3. Selecione seu OAuth 2.0 Client ID ou crie um novo
4. Adicione os seguintes domínios:

**Authorized JavaScript origins:**
```
https://app-medico-2.vercel.app
https://f718139e-0921-4562-b04f-6519c248b00c.sandbox.lovable.dev
http://localhost:8080
```

**Authorized redirect URIs:**
```
https://app-medico-2.vercel.app
https://f718139e-0921-4562-b04f-6519c248b00c.sandbox.lovable.dev
http://localhost:8080
```

### 2. Configure o Client ID no Código

No arquivo `src/hooks/useCalendarSync.ts`, substitua `YOUR_GOOGLE_CLIENT_ID` pelo seu Client ID real:

```javascript
const clientId = "SUA_GOOGLE_CLIENT_ID_AQUI.apps.googleusercontent.com";
```

### 3. Configuração do Supabase (se usar backend)

Se estiver usando Supabase, configure também:
1. No Supabase Dashboard > Authentication > Providers
2. Ative o Google provider
3. Adicione o Client ID e Client Secret

### 4. Scopes Necessários

Os scopes já configurados são:
- `https://www.googleapis.com/auth/calendar` - Acesso ao calendário
- `https://www.googleapis.com/auth/userinfo.email` - Email do usuário

### 5. Testes

Para testar em desenvolvimento local:
1. Use `http://localhost:8080` nos domínios autorizados
2. Teste em produção com `app-medico-2.vercel.app`

## Documentação Adicional

- [Google OAuth 2.0 Setup](https://developers.google.com/identity/oauth2/web/setup)
- [Google Calendar API](https://developers.google.com/calendar/api/quickstart/js)