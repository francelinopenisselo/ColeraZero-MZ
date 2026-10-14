# Prevenção da Cólera e Cuidados com a Água em Moçambique

Aplicação Multimédia Educacional desenvolvida no âmbito da cadeira de **Ferramentas e Aplicações Multimédia** na **Universidade Pedagógica de Maputo (UP-Maputo)**.

- **Autores:** Almeida Fernando Chiboze, Francelino Penisselo, Safira António Vilanculos
- **Docente Orientador:** Miguel Maria Ribeiro da Silva
- **Data:** Outubro de 2026

---

## 1. Como Publicar no Vercel

O projeto foi preparado para deploy direto e estático no Vercel:

### Método 1: Via GitHub (Recomendado)
1. Crie um repositório no seu GitHub e suba esta pasta (`Apps`).
2. Acesse [vercel.com](https://vercel.com) e faça login.
3. Clique em **"Add New..."** > **"Project"** e selecione o seu repositório.
4. Mantenha as configurações pré-definidas (o ficheiro `vercel.json` e `index.html` na raiz serão detetados automaticamente).
5. Clique em **"Deploy"**. Em menos de 1 minuto o seu link público estará online com HTTPS gratuito.

### Método 2: Via Vercel CLI
No terminal, dentro desta pasta:
```bash
npx vercel
```
Siga as instruções rápidas na linha de comandos.

---

## 2. Como Ligar ao Supabase

A aplicação possui um **Mural de Acção Comunitária** e registo de respostas do Quiz que podem funcionar diretamente conectados ao Supabase.

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito.
2. No menu lateral esquerdo, vá em **SQL Editor**.
3. Abra o ficheiro [`supabase_setup.sql`](supabase_setup.sql) deste projeto, copie todo o conteúdo, cole no SQL Editor do Supabase e clique em **Run**.
4. No Supabase, vá a **Project Settings** > **API**.
5. Copie a **Project URL** e a chave pública **`anon` `public`**.
6. Abra o ficheiro [`supabase-config.js`](supabase-config.js) e cole os dados:
   ```javascript
   window.SUPABASE_CONFIG = {
     url: 'https://seu-id-de-projeto.supabase.co',
     anonKey: 'sua-chave-anonima-publica'
   };
   ```

> **Nota:** Se deixar os campos vazios em `supabase-config.js`, a aplicação funciona perfeitamente em **Modo Local**, guardando os dados no `localStorage` do navegador sem apresentar erros.

---

## 3. Teste em Dispositivos Móveis

A interface foi desenvolvida para ser totalmente responsiva:
- **Ecrãs pequenos (320px – 375px):** iPhone SE, Androids compactos.
- **Smartphones padrão (390px – 480px):** iPhone 12/13/14/15/16, Samsung Galaxy, Xiaomi.
- **Tablets e Computadores (768px – 1920px+):** Navegação adaptável com suporte a modo apresentação 16:9.
