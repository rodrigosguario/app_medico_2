# Guia de Solução de Problemas - Sincronização de Calendários

## ✅ **Problemas Corrigidos**

### 1. **Erro de Sintaxe no iCloud Calendar**
- **Problema**: Função `determineEventType` estava fora do escopo correto
- **Solução**: Movida para local correto no arquivo

### 2. **Tokens não sendo recuperados do banco**
- **Problema**: Sistema usava tokens fixos/demo em vez dos tokens salvos
- **Solução**: Implementada busca de tokens da tabela `calendar_sync_settings`

### 3. **Google Calendar não sincronizava**
- **Problema**: Função estava simulada sem chamar a edge function
- **Solução**: Implementada chamada real para `google-calendar-sync`

## 🔧 **Como Configurar Corretamente**

### **Google Calendar**
1. Vá para [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione um existente
3. Ative a API do Google Calendar
4. Crie credenciais OAuth 2.0
5. Configure as URLs de redirecionamento:
   - `https://seu-dominio.com`
   - `http://localhost:3000` (para desenvolvimento)

### **Microsoft Outlook**
1. Vá para [Azure Portal](https://portal.azure.com/)
2. Registre uma nova aplicação
3. Configure permissões para Microsoft Graph:
   - `Calendars.Read`
   - `Calendars.ReadWrite`
   - `User.Read`
4. Configure URLs de redirecionamento

### **iCloud Calendar**
1. Vá para [appleid.apple.com](https://appleid.apple.com/)
2. Acesse "Segurança" > "Senhas de App"
3. Gere uma senha específica para o app
4. Use seu Apple ID + senha de app para autenticação

## 🚨 **Problemas Comuns**

### **"Token não encontrado"**
- **Causa**: Calendário não foi conectado ou token expirou
- **Solução**: Desconecte e reconecte o calendário

### **"OAuth Error"**
- **Causa**: Configuração incorreta no provedor (Google/Microsoft)
- **Solução**: Verifique URLs de redirecionamento e Client IDs

### **"Falha na sincronização"**
- **Causa**: Problemas de conectividade ou token inválido
- **Solução**: Verifique logs no console do navegador

## 📊 **Como Verificar se Está Funcionando**

1. **Conectar Calendário**:
   - Status deve mudar para "Conectado"
   - Última sincronização deve aparecer

2. **Testar Sincronização**:
   - Clique em "Sincronizar"
   - Aguarde conclusão
   - Verifique eventos importados

3. **Verificar Logs**:
   - Abra o console do navegador (F12)
   - Procure por mensagens de erro ou sucesso

## 🔄 **Fluxo de Sincronização**

1. **Conexão**: OAuth com provedor → Salva token
2. **Import**: Busca eventos do calendário externo → Salva no banco
3. **Export**: Pega eventos locais → Envia para calendário externo
4. **Bidirectional**: Executa import + export

## 🛠️ **Para Desenvolvedores**

- Tokens são salvos na tabela `calendar_sync_settings`
- Edge functions em `supabase/functions/`
- Histórico de sincronização em `sync_history`
- Logs detalhados no console para debug

## 📝 **Próximos Passos**

Para implementação completa em produção:
1. Configure credenciais OAuth reais
2. Implemente refresh token para Google
3. Configure webhooks para sincronização em tempo real
4. Adicione retry logic para falhas temporárias