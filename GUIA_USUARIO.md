# Guia do Usuário - Ferramentas de Teste e Diagnóstico

**Data:** 17 de setembro de 2025
**Autor:** Manus AI

## 1. Introdução

Este guia foi criado para ajudar você a usar as novas ferramentas de teste e diagnóstico que foram adicionadas ao projeto "App Médico". Com elas, você pode verificar a "saúde" do sistema e testar funcionalidades importantes sem precisar de conhecimentos técnicos avançados.

## 2. Como Acessar a Página de Testes

Para acessar as ferramentas, basta adicionar `/test` ao final do endereço do seu aplicativo no navegador.

**Exemplo:** `http://localhost:3000/#/test`

**Importante:** Esta página só está disponível quando o aplicativo está rodando no seu computador (em modo de desenvolvimento). Ela não será acessível para os usuários finais da aplicação.

## 3. Funcionalidades da Página de Testes

A página é dividida em quatro abas principais:

### 3.1. Diagnóstico do Sistema

Esta é a primeira aba que você verá. Ela faz um check-up completo do sistema e mostra o status de cada componente:

-   **Conectividade:** Verifica se você está conectado à internet.
-   **Configuração Supabase:** Confere se as chaves de API estão no arquivo `.env`.
-   **Autenticação:** Mostra se há um usuário logado.
-   **Banco de Dados:** Testa a conexão com o banco de dados principal.
-   **Perfil do Usuário:** Verifica se o perfil do médico foi carregado corretamente.
-   **Armazenamento Local:** Testa se o navegador consegue guardar informações.
-   **Estrutura do Banco:** Confere se todas as tabelas importantes existem.

**Como usar:**

-   Ao abrir a página, o diagnóstico é executado automaticamente.
-   Você pode clicar no botão **"Executar Diagnóstico"** para rodar os testes novamente a qualquer momento.
-   Os resultados são exibidos com ícones de status (✅ Sucesso, ⚠️ Aviso, ❌ Erro) e mensagens claras.

### 3.2. Teste do Calendário

Esta aba permite que você teste a criação de eventos do calendário de forma segura, sem enviar nada para o banco de dados.

**Como usar:**

1.  **Preencha o formulário:** Você pode preencher os campos do evento como faria normalmente.
2.  **Use dados de exemplo:** Clique no botão **"Preencher Dados de Exemplo"** para carregar o formulário com informações de teste.
3.  **Execute os testes:** Clique em **"Executar Testes"**. O sistema irá validar os dados e mostrar os resultados, indicando se tudo está correto para ser enviado ao banco.

### 3.3. Status do Banco de Dados

Esta aba fornece uma visão geral da estrutura do seu banco de dados no Supabase, mostrando as tabelas principais e as políticas de segurança que foram configuradas.

### 3.4. Status da Autenticação

Aqui você pode ver as informações do usuário que está logado no momento, incluindo e-mail, ID e outros dados do perfil.

## 4. Como Configurar as Chaves do Supabase

Para que o aplicativo funcione completamente, você precisa adicionar as chaves do seu projeto Supabase ao arquivo `.env`.

**Passo a passo:**

1.  **Acesse o Supabase:** Faça login na sua conta em [supabase.com](https://supabase.com).
2.  **Abra seu projeto:** Selecione o projeto do "App Médico".
3.  **Vá para as Configurações:** No menu à esquerda, clique no ícone de engrenagem (Settings).
4.  **Clique em "API":** Na seção "Project Settings", clique em "API".
5.  **Copie as informações:** Você precisará de duas informações:
    -   **Project URL:** A URL do seu projeto.
    -   **Project API Keys (anon public):** A chave pública (anon key).
6.  **Cole no arquivo `.env`:** Abra o arquivo `.env` na pasta principal do seu projeto e cole as informações da seguinte forma:

    ```
    VITE_SUPABASE_URL=COLE_A_URL_DO_PROJETO_AQUI
    VITE_SUPABASE_PUBLISHABLE_KEY=COLE_A_CHAVE_ANON_PUBLIC_AQUI
    ```

7.  **Reinicie o aplicativo:** Se o aplicativo estiver rodando, pare e inicie novamente para que ele carregue as novas configurações.

Com isso, seu aplicativo estará 100% funcional e pronto para ser usado!

