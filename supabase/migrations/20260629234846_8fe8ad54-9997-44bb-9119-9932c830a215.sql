-- Rotaciona a senha do admin que foi commitada em texto plano em migração anterior.
-- Substitui por uma senha aleatória inutilizável; a admin recupera o acesso via fluxo
-- "Esqueci minha senha" (recovery por e-mail).
UPDATE auth.users
SET encrypted_password = crypt(encode(gen_random_bytes(48), 'base64'), gen_salt('bf')),
    updated_at = now()
WHERE lower(email) = 'sarasuporteoficial@gmail.com';