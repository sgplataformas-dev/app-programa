# Redesign das fases na aba Home

## Objetivo
Transformar somente os cartões de Fase 1, Fase 2 e Fase 3 da aba `/hoje`, seguindo a imagem anexada e a direção “Horizontal phase cards” escolhida.

## Alterações
- Reorganizar cada fase como uma faixa horizontal empilhada, com a capa atual em destaque e uma área clara de acesso às aulas.
- Preservar os títulos existentes: “Combatendo a inflamação intestinal”, “Reativando a produção de GLP-1 e GIP” e “Regulando a microbiota intestinal”.
- Usar verde profundo, dourado, off-white e branco; destacar a fase atual em dourado.
- Aplicar títulos em Outfit e textos em Figtree, mantendo boa leitura no celular.
- Exibir claramente número da fase, estado atual e ação para acessar as aulas, com ícone e seta.
- Manter a navegação atual de cada cartão e o comportamento de fases liberadas ou bloqueadas.
- Não alterar o banner “Continue assistindo”, o texto introdutório, a navegação inferior ou outras telas.

## Validação
- Conferir visualmente a aba `/hoje` em celular e desktop.
- Testar o clique das três fases e confirmar que cada uma abre seu módulo correto.
- Verificar que textos, capas e estados não se sobrepõem ou cortam.

## Detalhes técnicos
- Ajustar o `FaseRow` da tela Home e os tokens tipográficos/visuais necessários no estilo global.
- Reutilizar as capas já cadastradas em cada módulo, sem incorporar a imagem de referência ao aplicativo.
