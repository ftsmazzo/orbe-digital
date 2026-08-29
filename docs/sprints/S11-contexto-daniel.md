# Sprint S11 — Contexto comercial Daniel (marca, contrato, RAG, score)

## Entregavel
Checklist pos-audios + contrato Soluciona: documentos com marca DH e rubricas, comercial v2 (5 abas, Ideal/Problema, M1/M6), honorarios 15% EBITDA, fichas/RAG, aprendizado do score.

## Aceite
- [x] Template PDF/impressao com logo DH, CNPJ e bloco de assinaturas (diagnostico, dashboard, relatorio, proposta, contrato)
- [x] Logo ORBE so na UI; documentos ao cliente usam marca DH
- [x] Modalidades success-fee lado a lado: M1 e carencia M6 (padrao Soluciona)
- [x] Score Ideal/Neutro/Problema + historico admitir/recusar (pesos apos 3 casos)
- [x] Calculadora 15% EBITDA, lancamento mensal, alerta dia 10 / mora 30-60
- [x] Fichas Hill (3x) / Kaplan (2x) / demais (1x) + trechos colados pelo consultor (sem baixar livro)
- [x] Retrieval injetado em diagnostico, pesquisa R, proposta e relatorio

## Fora de escopo
Folha trabalhista completa, valuation bank-grade, alterar n8n Pazotti, treinar LLM, piratear livros.

## Dependencias do Daniel
1. Export SVG/PNG 300dpi das logos Corel (hoje ha SVG placeholder nas cores DH/ORBE).
2. PDFs do acervo com direito de uso (colar trechos em `/app/settings/knowledge`).
3. Assinatura manuscrita PNG se quiser rubrica grafica alem do Autentique.

## Demo
- `/app/settings/knowledge`
- `/app/clients/[id]` qualificacao + atalhos EBITDA/contrato
- `/print/{proposal|report|contract|diagnostic|dashboard}/[id]`
