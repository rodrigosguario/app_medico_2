-- Criar o trigger que falta para criar perfis automaticamente quando um usuário se registra
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Verificar se a função está criada corretamente
SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user';