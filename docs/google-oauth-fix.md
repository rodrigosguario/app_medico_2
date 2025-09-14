# Como Configurar Google OAuth - Correção dos Problemas

## Problema Identificado
O Google OAuth está configurado mas requer verificação adicional (2FA) devido à configuração incorreta dos domínios autorizados.

## Solução Completa

### 1. Configurar Google Cloud Console

1. **Acesse:** https://console.cloud.google.com/apis/credentials
2. **Encontre seu OAuth 2.0 Client ID** (já configurado no código)
3. **Edite as configurações:**

#### Authorized JavaScript Origins:
```
https://f718139e-0921-4562-b04f-6519c248b00c.lovableproject.com
https://agenda-medica-app.vercel.app (se deployado)
http://localhost:3000 (desenvolvimento local)
```

#### Authorized Redirect URIs:
```
https://f718139e-0921-4562-b04f-6519c248b00c.lovableproject.com
https://f718139e-0921-4562-b04f-6519c248b00c.lovableproject.com/callback
https://agenda-medica-app.vercel.app (se deployado)
https://agenda-medica-app.vercel.app/callback (se deployado)
```

### 2. Configurar Supabase Auth URLs

**IMPORTANTE:** Configure no Supabase Dashboard > Authentication > URL Configuration:

- **Site URL:** `https://f718139e-0921-4562-b04f-6519c248b00c.lovableproject.com`
- **Redirect URLs:** 
  ```
  https://f718139e-0921-4562-b04f-6519c248b00c.lovableproject.com/**
  https://agenda-medica-app.vercel.app/** (se deployado)
  ```

### 3. Teste OAuth Screen Configuration

No Google Cloud Console > OAuth consent screen:

1. **Marque como "External"** (para testes)
2. **Adicione Test Users:** Adicione seu email para testes
3. **Scopes necessários:**
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/userinfo.email`

### 4. Problemas Comum e Soluções

#### "Acesso negado" ou "2FA requerido"
- ✅ Adicione seu email como Test User
- ✅ Configure domínios autorizados corretamente
- ✅ Use HTTPS (não HTTP) nos redirects

#### "Invalid redirect URI"
- ✅ URLs devem ser EXATAS no Google Console
- ✅ Não use wildcards (`*`) no Google Console
- ✅ Configure todas as URLs onde a app roda

## Melhorias Implementadas

### ✅ Histórico de Sincronizações
- Agora registra todas as sincronizações na tabela `sync_history`
- Mostra detalhes de eventos importados/exportados
- Timestamp correto da última sincronização

### ✅ Feedback Visual Melhorado
- Estados de loading durante sincronização
- Toasts específicos para cada tipo de operação
- Indicadores visuais claros (spinning icons)

### ✅ Edge Functions Otimizadas
- Logs detalhados para debugging
- Tratamento de erro robusto
- Tokens demo funcionais para desenvolvimento

## Próximos Passos

1. **Configure os domínios** no Google Cloud Console
2. **Teste a conexão** com Google Calendar
3. **Verifique o histórico** de sincronizações
4. **Configure URLs do Supabase** se necessário

## Suporte

Se ainda houver problemas:
1. Verifique logs do console do navegador
2. Confirme configurações no Google Cloud Console
3. Teste com usuário adicionado como Test User