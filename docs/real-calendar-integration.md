# Como Importar Eventos Reais dos Calendários

## 🔍 **Problema Identificado**

Você tem:
- ✅ **Google Calendar**: Token real configurado 
- ⚠️ **Outlook**: Token demo (precisa configurar OAuth real)
- ⚠️ **iCloud**: Credenciais configuradas mas CalDAV não implementado

## 🚀 **Soluções para Cada Calendário**

### **1. Google Calendar (FUNCIONA)**
- Você já tem token real: `ya29.a0AQQ_...`
- A sincronização deve funcionar com eventos reais
- Se não funcionar, pode ter problema na edge function

### **2. Microsoft Outlook (PRECISA CONFIGURAR)**

**Por que só mostra eventos demo:**
- Token atual: `demo_microsoft_token_...` (não é real)
- Precisa configurar OAuth real no Azure

**Como configurar:**
1. Vá para [Azure Portal](https://portal.azure.com/)
2. Azure Active Directory > App registrations > New registration
3. Nome: "MedicalCalendarSync"
4. Redirect URI: `https://seu-dominio.com/auth/callback`
5. API permissions:
   - Microsoft Graph > Calendars.Read
   - Microsoft Graph > Calendars.ReadWrite
   - Microsoft Graph > User.Read
6. Copie o Client ID para o código

### **3. iCloud Calendar (LIMITADO)**
- Suas credenciais: `c2d1YXJpb3JvZHJpZ29AZ21haWwuY29tOlRlY3RANDBtZw==`
- Decodificado: `sguariorodrigo@gmail.com:Tect@40mg`
- CalDAV ainda não está implementado

## 🔧 **Correções Aplicadas**

1. **Melhor detecção de tokens reais vs demo**
2. **Logs mais claros sobre qual tipo de token está sendo usado**
3. **Mensagens específicas para cada situação**

## 📋 **Para Testar Google Calendar**

1. Vá para "Calendário" > "Sincronização"
2. Teste sincronizar **apenas Google Calendar**
3. Verifique se importa eventos reais do seu Google

## 📝 **Próximos Passos**

### **Para Outlook Real:**
1. Configure OAuth no Azure (instruções acima)
2. Atualize o Client ID no código
3. Reconecte o Outlook

### **Para iCloud Real:**
1. Implementar protocolo CalDAV
2. Ou usar API do iCloud (mais complexo)

### **Debugging:**
- Abra F12 > Console
- Procure logs como "🚀 Chamando Google Calendar API..."
- Se aparecer "⚠️ Usando eventos demo", o token não é real

## ⚡ **Teste Rápido**

Execute este teste agora:
1. **Desconecte** todos os calendários
2. **Reconecte APENAS Google Calendar**
3. **Sincronize** e veja se importa eventos reais
4. Se funcionar, o problema está nos outros provedores