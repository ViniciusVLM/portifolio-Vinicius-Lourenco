# Portfólio — Vinicius Lourenço

Meu site pessoal: projetos, carreira e contato.

O cubo mágico da abertura é montado em Three.js e renderizado em retícula (pontos). Enquanto fica na tela ele se resolve sozinho, comemora e se embaralha de novo. Clique nele para ver o modo aramado. O resto é HTML, CSS e JavaScript puro, sem framework e sem build.

## Rodar localmente

Os arquivos usam módulos ES, então precisam de um servidor (abrir o `index.html` direto não funciona):

```bash
python -m http.server 8000
# ou
npx serve .
```

Depois é só abrir `http://localhost:8000`.

## Editar o conteúdo

Todo o texto do site fica em [`js/data.js`](js/data.js): perfil, formação, carreira, skills, projetos e conquistas. Campos entre colchetes, tipo `[início]`, aparecem em laranja até serem preenchidos.

- **Foto:** `assets/foto.jpg` já está tratada (fundo removido, em tons de cinza). Para trocar, use uma foto com o fundo preto; sem foto, aparece uma silhueta.
- **Certificados:** coloque as imagens em `assets/certificados/` e adicione na lista `conquistas`.
- **Projetos:** as prévias ficam em `assets/projetos/`.

## Publicar no GitHub Pages

1. Suba os arquivos para um repositório.
2. Em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`.
3. O site fica em `https://viniciusvlm.github.io/<nome-do-repositório>/`.

## Estrutura

```
index.html
css/style.css
js/
  main.js           monta as seções a partir do data.js
  data.js           conteúdo
  cube.js           cubo mágico 3D + efeito de retícula
  portrait.js       retrato em pontos
  globe.js          globo de pontos
  land.js           pontos de terra do globo (gerado do world-atlas)
  constellation.js  mapa de skills
  particles.js      partículas do contato
  stars.js, waves.js, icons.js
assets/
```
