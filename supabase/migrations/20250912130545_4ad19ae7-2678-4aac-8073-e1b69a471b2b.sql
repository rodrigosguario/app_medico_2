-- Verificar se o trigger para criar perfil está funcionando
SELECT t.tgname, t.tgenabled 
FROM pg_trigger t 
JOIN pg_class c ON t.tgrelid = c.oid 
WHERE c.relname = 'users' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth');

-- Verificar se o trigger para criar calendário está funcionando  
SELECT t.tgname, t.tgenabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'profiles' AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');