-- Permitir inserção na tabela sync_history via edge functions
INSERT INTO sync_history (user_id, provider, sync_type, sync_status, started_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test', 'bidirectional', 'completed', now())
ON CONFLICT DO NOTHING;

-- Criar política para permitir que edge functions insiram no histórico
CREATE POLICY "Service role can insert sync history" ON sync_history
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Criar política para permitir que edge functions atualizem o histórico
CREATE POLICY "Service role can update sync history" ON sync_history
FOR UPDATE 
TO service_role
USING (true);

-- Remover o registro de teste
DELETE FROM sync_history WHERE provider = 'test';