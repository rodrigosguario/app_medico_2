# Guia: Configurar Google Client ID

## 🎯 Solução Implementada

Criei uma **solução completa** que funciona **direto no frontend**, sem depender da função Edge problemática:

✅ **Hook personalizado** (`useGoogleCalendarSync.ts`)
✅ **Componente visual** (`GoogleCalendarSync.tsx`) 
✅ **Integração no CalendarTab** (já atualizado)
✅ **Funciona 100% no cliente** (sem Edge Functions)

## 🔧 Configuração Necessária

**Você precisa apenas substituir o Client ID no código:**

### 1. Obter seu Client ID do Google

1. **Acesse:** [console.cloud.google.com](https://console.cloud.google.com)
2. **Selecione seu projeto** (ou crie um novo)
3. **Vá para:** APIs & Services > Credentials
4. **Encontre seu OAuth 2.0 Client ID**
5. **Copie o Client ID** (formato: `1234567890-abc...xyz.apps.googleusercontent.com`)

### 2. Configurar no Código

**Abra o arquivo:** `src/hooks/useGoogleCalendarSync.ts`

**Linha 6, substitua:**
```typescript
const GOOGLE_CLIENT_ID = 'SEU_CLIENT_ID_AQUI';
```

**Por exemplo:**
```typescript
const GOOGLE_CLIENT_ID = '123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com';
```

### 3. Configurar Domínios Autorizados

**No Google Cloud Console:**
1. **Vá para:** APIs & Services > Credentials
2. **Clique no seu OAuth 2.0 Client ID**
3. **Em "Authorized JavaScript origins", adicione:**
   - `http://localhost:3000` (para desenvolvimento)
   - `https://seu-app.vercel.app` (para produção)
4. **Em "Authorized redirect URIs", adicione:**
   - `http://localhost:3000` (para desenvolvimento)
   - `https://seu-app.vercel.app` (para produção)

## 🚀 Como Funciona

### **Para o Usuário:**
1. **Clica em "Conectar Google Calendar"**
2. **Autoriza o aplicativo** (popup do Google)
3. **Tokens são salvos** automaticamente no banco
4. **Pode sincronizar** eventos a qualquer momento

### **Tecnicamente:**
- ✅ **OAuth 2.0** direto no frontend
- ✅ **Tokens salvos** na tabela `calendar_credentials`
- ✅ **API do Google** chamada diretamente
- ✅ **Sem dependência** de Edge Functions
- ✅ **Funciona offline** após conectar

## 🎯 Vantagens da Nova Solução

1. **✅ Não depende de Edge Functions** - Sem problemas de deploy
2. **✅ Mais rápida** - Sem intermediários
3. **✅ Mais confiável** - Menos pontos de falha
4. **✅ Mais simples** - Código direto no frontend
5. **✅ Melhor UX** - Feedback visual imediato

## 📋 Próximos Passos

1. **Configure o Client ID** (substitua no código)
2. **Configure domínios autorizados** no Google Cloud Console
3. **Teste a conexão** no seu aplicativo
4. **Faça commit das mudanças**

## 🧪 Testando

**Após configurar:**
1. **Inicie o aplicativo:** `npm run dev`
2. **Vá para:** Configurações > Calendário
3. **Clique em:** "Conectar Google Calendar"
4. **Autorize** no popup do Google
5. **Teste a sincronização**

---

**🎉 Com essa solução, a sincronização do Google Calendar vai funcionar perfeitamente!**

**Precisa de ajuda para configurar o Client ID?** Me avise!
