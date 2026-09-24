// O tipo `vite/client` ja cobre imagens/fontes/audio comuns, mas nao PDF —
// usado aqui como import direto (@/assets/*.pdf) desde a troca dos
// *.asset.json do Lovable pelos arquivos reais.
declare module "*.pdf" {
  const src: string;
  export default src;
}
