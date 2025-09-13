-- Inserir dados de exemplo com valores corretos para event_type
INSERT INTO public.events (
  user_id, 
  calendar_id, 
  title, 
  start_time, 
  end_time, 
  event_type, 
  status,
  description,
  location,
  value
) VALUES 
(
  'd73ab36c-d96c-4ae6-94fc-993b20459372',
  (SELECT id FROM public.calendars WHERE user_id = 'd73ab36c-d96c-4ae6-94fc-993b20459372' LIMIT 1),
  'Consulta - João Silva',
  '2025-09-15 09:00:00+00:00',
  '2025-09-15 10:00:00+00:00',
  'CONSULTA_PARTICULAR',
  'CONFIRMADO',
  'Consulta de rotina - Cardiologia',
  'Consultório Dr. Rodrigo',
  300.00
),
(
  'd73ab36c-d96c-4ae6-94fc-993b20459372',
  (SELECT id FROM public.calendars WHERE user_id = 'd73ab36c-d96c-4ae6-94fc-993b20459372' LIMIT 1),
  'Exame - Maria Santos',
  '2025-09-16 14:00:00+00:00',
  '2025-09-16 15:00:00+00:00',
  'CONSULTA_PARTICULAR',
  'CONFIRMADO',
  'Ecocardiograma',
  'Clínica CardioVida',
  450.00
);

-- Inserir alguns eventos financeiros de exemplo
INSERT INTO public.financial_events (
  user_id,
  description,
  amount,
  date,
  transaction_type,
  category,
  is_paid,
  payment_method
) VALUES 
(
  'd73ab36c-d96c-4ae6-94fc-993b20459372',
  'Consulta - João Silva',
  300.00,
  '2025-09-15',
  'RECEITA',
  'CONSULTAS',
  true,
  'PIX'
),
(
  'd73ab36c-d96c-4ae6-94fc-993b20459372',
  'Exame - Maria Santos',
  450.00,
  '2025-09-16',
  'RECEITA',
  'EXAMES',
  false,
  'CARTAO_CREDITO'
),
(
  'd73ab36c-d96c-4ae6-94fc-993b20459372',
  'Aluguel do consultório',
  2500.00,
  '2025-09-01',
  'DESPESA',
  'OPERACIONAL',
  true,
  'TRANSFERENCIA'
);