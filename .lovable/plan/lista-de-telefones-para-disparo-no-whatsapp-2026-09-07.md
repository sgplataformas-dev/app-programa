# Lista de telefones para disparo no WhatsApp

Os telefones existem: 6.186 dos 6.878 cadastros têm telefone no perfil, e as compras da Payt também trazem o telefone do comprador (uso como reserva quando o perfil está vazio).

## O que vou criar

Uma aba nova no painel de admin chamada **Contatos / Disparo**, com dois botões de download em planilha (CSV, abre no Excel e serve para importar em ferramenta de disparo):

1. **Pouco consumo** — clientes com compra ativa que nunca entraram nas aulas ou assistiram até 5% do conteúdo.
2. **Compradores do fim de semana** — compras aprovadas de sábado 05/09, domingo 06/09 e segunda 07/09 até meio-dia.

Cada linha traz: nome, telefone (formatado com +55, pronto para WhatsApp), e-mail, data da compra, aulas assistidas e o percentual consumido.

Na tela também mostro a contagem de cada lista antes de baixar, e uma opção para escolher o período do segundo relatório, caso queira repetir o disparo em outras datas.

## Regras aplicadas

- Só entram clientes com compra válida (aprovada/paga) e sem reembolso, cancelamento ou chargeback.
- Telefones duplicados ou inválidos (menos de 10 dígitos) são descartados.
- Quem está na lista de bloqueio não aparece.

## Detalhes técnicos

- Server function em `src/lib/admin.functions.ts`, protegida pela verificação de admin já existente, retornando as duas listas.
- Consumo calculado por `lesson_progress` distinto por usuário dividido pelo total de aulas do catálogo em `src/content/aulas.ts`.
- Telefone: `profiles.telefone`, com fallback para `purchases.raw_payload->'customer'->>'phone'`; normalizado para E.164.
- Geração do CSV no cliente (Blob + download), sem novas tabelas.
