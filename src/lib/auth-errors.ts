// Traduz mensagens de erro do Supabase Auth para PT-BR amigável,
// com tom acolhedor para não assustar o lead.

const MAP: Array<{ test: RegExp; msg: string }> = [
  {
    test: /signups? (are )?not allowed|signup is disabled|signup disabled/i,
    msg: "Seu acesso é liberado automaticamente após a confirmação da compra. Toque em ‘Esqueci / criar a senha’ para receber o link de acesso no seu e-mail.",
  },
  {
    test: /invalid login credentials|invalid (email|password)/i,
    msg: "E-mail ou senha incorretos. Confira os dados e tente de novo, ou toque em ‘Esqueci / criar a senha’.",
  },
  {
    test: /email not confirmed/i,
    msg: "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (e o spam) para concluir o acesso.",
  },
  {
    test: /user already registered|already exists/i,
    msg: "Este e-mail já tem cadastro. Toque em ‘Esqueci / criar a senha’ para definir uma nova senha.",
  },
  {
    test: /user not found|no user found/i,
    msg: "Não encontramos uma conta com este e-mail. Confira se é o mesmo e-mail usado na compra.",
  },
  {
    test: /password.*(should|must).*(at least|6 characters|8 characters|characters long)/i,
    msg: "Sua senha está curta demais. Use no mínimo 8 caracteres para deixá-la mais segura.",
  },
  {
    test: /password.*(pwned|known to be weak|too weak|weak password|leaked|compromised)/i,
    msg: "Essa senha apareceu em vazamentos públicos e não é segura. Escolha uma combinação diferente — misturando letras, números e símbolos.",
  },
  {
    test: /password.*(uppercase|lowercase|number|digit|symbol|special character)/i,
    msg: "Para sua segurança, sua senha precisa misturar letras maiúsculas, minúsculas, números e símbolos.",
  },
  {
    test: /new password should be different/i,
    msg: "Sua nova senha precisa ser diferente da anterior.",
  },
  {
    test: /same password/i,
    msg: "Escolha uma senha diferente da que você já usava.",
  },
  {
    test: /rate limit|too many requests|429/i,
    msg: "Você fez muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.",
  },
  {
    test: /for security purposes.*once every/i,
    msg: "Por segurança, aguarde alguns segundos antes de tentar novamente.",
  },
  {
    test: /(token|otp|link).*(expired|invalid)|invalid (token|otp|code)|email link is invalid|otp expired/i,
    msg: "Este link expirou ou já foi usado. Volte para a tela de login e toque em ‘Esqueci / criar a senha’ para receber um novo.",
  },
  {
    test: /auth session missing|session not found|jwt expired/i,
    msg: "Sua sessão expirou. Entre novamente para continuar.",
  },
  {
    test: /network|failed to fetch|load failed/i,
    msg: "Não conseguimos falar com o servidor. Verifique sua conexão e tente de novo.",
  },
  {
    test: /email.*invalid|invalid.*email/i,
    msg: "O e-mail digitado parece inválido. Confira se está escrito corretamente.",
  },
];

export function traduzirErroAuth(error: unknown, fallback = "Algo não deu certo agora. Tente novamente em instantes."): string {
  const raw =
    (typeof error === "string" && error) ||
    (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string"
      ? (error as { message: string }).message
      : "");
  if (!raw) return fallback;
  for (const { test, msg } of MAP) {
    if (test.test(raw)) return msg;
  }
  return fallback;
}
