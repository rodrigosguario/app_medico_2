# Guia de Deploy - Aplicativo Médico

## 🚀 Deploy no Vercel

### 1. **Configuração de Variáveis de Ambiente**

No painel do Vercel, configure as seguintes variáveis de ambiente:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://kmwsoppkrjzjioeadtqb.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3NvcHBrcmp6amlvZWFkdHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3ODkzNzYsImV4cCI6MjA3MzM2NTM3Nn0.RsQd3r30Ezfi5x_Di2eLgkqm5SCDC9tlOIXIDRJcYMY
```

### 2. **Configuração do Supabase**

#### Domínios Autorizados
Adicione os seguintes domínios no painel do Supabase:
- `http://localhost:8080` (desenvolvimento)
- `https://seu-dominio.vercel.app` (produção)
- `https://app-medico-2.vercel.app` (se aplicável)

#### Configuração de Auth
```sql
-- Configurar redirect URLs
UPDATE auth.config 
SET site_url = 'https://seu-dominio.vercel.app',
    additional_redirect_urls = 'http://localhost:8080,https://seu-dominio.vercel.app';
```

### 3. **Build e Deploy**

#### Comandos de Build
```bash
npm install
npm run build
```

#### Configuração do Vercel
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

## 🔧 Configurações Adicionais

### 1. **CORS no Supabase**
Verifique se o CORS está configurado para aceitar requests do domínio de produção.

### 2. **Políticas RLS**
As políticas já estão configuradas e funcionais:
- ✅ Profiles: Usuários podem gerenciar seus próprios perfis
- ✅ Events: Usuários podem gerenciar seus próprios eventos
- ✅ Calendars: Usuários podem gerenciar seus próprios calendários
- ✅ Financial Events: Usuários podem gerenciar seus próprios eventos financeiros
- ✅ Hospitals: Usuários podem visualizar hospitais ativos
- ✅ Sync Settings: Usuários podem gerenciar suas configurações de sincronização

### 3. **Triggers e Funções**
Já implementados:
- ✅ `handle_new_user()`: Cria perfil automaticamente para novos usuários
- ✅ `update_updated_at_column()`: Atualiza timestamp em modificações

## 📱 Funcionalidades Operacionais

### ✅ **Funcionando Corretamente**
1. **Autenticação**
   - Registro de novos usuários
   - Login com email/senha
   - Criação automática de perfil
   - Sessão persistente

2. **Interface**
   - Dashboard principal
   - Navegação entre seções
   - Formulários responsivos
   - Design profissional

3. **Banco de Dados**
   - Conectividade estável
   - Políticas de segurança
   - Triggers funcionais
   - Dados persistidos

### ⚠️ **Necessita Correção**
1. **Criação de Eventos**
   - Erro 400 na submissão
   - Formato de data incompatível
   - Validação de campos

2. **Sincronização**
   - Integração com Google Calendar
   - Webhooks não configurados
   - Sincronização bidirecional

## 🔍 Monitoramento

### Logs Importantes
Monitore os seguintes logs no console:
- `🔧 Inicializando cliente Supabase`
- `✅ Supabase conectado com sucesso`
- `🔐 Tentando fazer login`
- `📝 Tentando criar conta`

### Métricas de Sucesso
- Taxa de login: Deve ser > 95%
- Tempo de carregamento: < 3 segundos
- Erros de conectividade: < 1%

## 🚨 Troubleshooting

### Problema: Erro de Autenticação
**Solução**: Verificar variáveis de ambiente e domínios autorizados

### Problema: Erro 400 na Criação de Eventos
**Solução**: Investigar formato de data e validação de campos

### Problema: Falha na Conectividade
**Solução**: Verificar chaves do Supabase e configuração de CORS

## 📞 Suporte

Para problemas técnicos:
1. Verificar logs do console do navegador
2. Verificar logs do Supabase
3. Verificar configurações de ambiente
4. Consultar documentação do Supabase

## 🎯 Próximos Passos

1. **Corrigir criação de eventos** (alta prioridade)
2. **Implementar sincronização completa** (média prioridade)
3. **Adicionar testes automatizados** (baixa prioridade)
4. **Implementar monitoramento** (baixa prioridade)

---

**Status Atual**: 75% funcional - Pronto para uso básico
**Última Atualização**: 15/09/2025
