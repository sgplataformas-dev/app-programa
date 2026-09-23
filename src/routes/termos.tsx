import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso e Privacidade — Programa ACTIVE" },
      {
        name: "description",
        content:
          "Termos de uso, política de privacidade e tratamento de dados do Programa ACTIVE.",
      },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background px-6 py-8">
      <Link
        to="/perfil"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Voltar
      </Link>

      <h1 className="mt-4 text-2xl font-extrabold leading-tight">
        Termos de Uso e Privacidade
      </h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Última atualização: 22 de junho de 2026
      </p>

      <article className="prose prose-sm mt-6 max-w-none text-sm leading-relaxed text-foreground">
        <h2 className="mt-6 text-base font-bold">1. Sobre o Programa ACTIVE</h2>
        <p className="mt-2 text-muted-foreground">
          O Programa ACTIVE é um material informativo de educação alimentar e
          acompanhamento de hábitos. Não substitui consulta médica, nutricional
          ou qualquer outra orientação profissional individualizada.
        </p>

        <h2 className="mt-6 text-base font-bold">2. Acesso e conta</h2>
        <p className="mt-2 text-muted-foreground">
          Sua conta é criada automaticamente após a aprovação da compra. Use o
          mesmo e-mail informado no checkout para entrar. Você é responsável
          por manter suas credenciais em segurança. Em caso de reembolso ou
          cancelamento, o acesso pode ser revogado.
        </p>

        <h2 className="mt-6 text-base font-bold">3. Dados que coletamos</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Dados de cadastro: nome, e-mail e telefone.</li>
          <li>
            Dados de uso: progresso nas aulas, check-ins diários, pontuação,
            registros de peso e respostas da avaliação inicial.
          </li>
          <li>
            Conteúdos enviados por você: comentários e fotos opcionais
            anexadas às aulas.
          </li>
          <li>Dados da compra recebidos do processador de pagamento (Payt).</li>
        </ul>

        <h2 className="mt-6 text-base font-bold">4. Como usamos seus dados</h2>
        <p className="mt-2 text-muted-foreground">
          Usamos seus dados exclusivamente para liberar o acesso ao programa,
          personalizar seu acompanhamento, enviar comunicações relacionadas ao
          conteúdo adquirido e cumprir obrigações legais. Não vendemos seus
          dados para terceiros.
        </p>

        <h2 className="mt-6 text-base font-bold">5. Compartilhamento</h2>
        <p className="mt-2 text-muted-foreground">
          Compartilhamos dados apenas com provedores essenciais para a operação
          do serviço (hospedagem, banco de dados, e-mail transacional e
          processamento de pagamento), sempre sob contratos de proteção de
          dados.
        </p>

        <h2 className="mt-6 text-base font-bold">6. Seus direitos (LGPD)</h2>
        <p className="mt-2 text-muted-foreground">
          Você pode, a qualquer momento, solicitar acesso, correção, exclusão
          ou portabilidade dos seus dados, além de revogar consentimentos.
          Para exercer seus direitos, fale com nosso suporte.
        </p>

        <h2 className="mt-6 text-base font-bold">7. Comentários e conteúdo</h2>
        <p className="mt-2 text-muted-foreground">
          Comentários publicados nas aulas ficam visíveis para outras alunas e
          alunos. Não publique informações sensíveis (telefone, endereço,
          documentos). Conteúdos ofensivos podem ser removidos pela
          administração.
        </p>

        <h2 className="mt-6 text-base font-bold">8. Segurança</h2>
        <p className="mt-2 text-muted-foreground">
          Aplicamos medidas técnicas razoáveis para proteger seus dados,
          incluindo conexões criptografadas e controle de acesso por usuário.
          Nenhum sistema é 100% imune; em caso de incidente, comunicaremos
          conforme exigido pela LGPD.
        </p>

        <h2 className="mt-6 text-base font-bold">9. Contato</h2>
        <p className="mt-2 text-muted-foreground">
          Dúvidas ou solicitações: sarasuporte@gmail.com ou WhatsApp{" "}
          <a
            href="https://wa.me/558882130565?text=Olá!%20Vim%20pelo%20aplicativo%20do%20Programa%20Active%20e%20tenho%20uma%20dúvida."
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline"
          >
            88 8213-0565
          </a>
          .
        </p>

        <h2 className="mt-6 text-base font-bold">10. Alterações</h2>
        <p className="mt-2 text-muted-foreground">
          Estes termos podem ser atualizados. Mudanças relevantes serão
          comunicadas dentro do aplicativo.
        </p>
      </article>

      <div className="mt-10" />
    </div>
  );
}
