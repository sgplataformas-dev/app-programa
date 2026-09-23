INSERT INTO public.purchases (email, payt_order_id, product_name, payment_status, purchase_date, raw_payload)
VALUES
 ('luciatripanon@gmail.com','MANUAL-ACTIVE-TRIPANON','Programa Active','paid', now(), '{"manual":true,"motivo":"liberacao manual suporte"}'::jsonb),
 ('ischastai@yahoo.com.br','MANUAL-ACTIVE-ISCHASTAI','Programa Active','paid', now(), '{"manual":true,"motivo":"liberacao manual suporte"}'::jsonb);