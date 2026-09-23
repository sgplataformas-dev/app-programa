# Aula 2 - Colágeno no Flacidez Nunca Mais

Adicionar uma nova aula com o vídeo enviado dentro do módulo "Flacidez Nunca Mais".

## O que muda

- Nova aula "Aula 2 - Colágeno" no módulo Flacidez Nunca Mais, usando o player enviado (id `vid-6a70b3161c982c86efa32beb`).
- A aula recebe o mesmo PDF "Flacidez Nunca Mais" como material de apoio, igual às outras.
- Fica liberada para quem já tem acesso ao programa Flacidez (a regra de acesso não muda).

## Detalhes técnicos

- Em `src/content/aulas.ts`, no programa `colageno` → módulo `colageno-natural`, incluir uma entrada de aula:
  - `id: "colageno-aula-2"`, `titulo: "Aula 2 - Colágeno"`, `vturbId: "vid-6a70b3161c982c86efa32beb"`, materiais com `planoColagenoPdf`.
- O player já carrega o script da mesma conta ConverteAI automaticamente a partir do `vturbId`, então nenhum código de player precisa mudar.

## Ponto a confirmar

Hoje o módulo tem "Aula Teórica" e "Aula Prática". A nova aula será inserida logo após a Aula Teórica; se preferir outra posição ou renomear as existentes para numeração (Aula 1, Aula 2...), é só avisar.
