# 🚀 Guia de Deploy no Vercel (Grátis)

## Passo 1: Preparar o Projeto

O projeto já está pronto! Apenas precisa fazer upload para o GitHub.

## Passo 2: Criar Conta no GitHub (se não tiver)

1. Aceda a https://github.com
2. Clique em "Sign up"
3. Preencha os dados e confirme o email
4. Pronto!

## Passo 3: Criar um Repositório no GitHub

1. Clique em "+" no canto superior direito
2. Selecione "New repository"
3. Dê um nome: `portal-estagiarios-socem`
4. Selecione "Public"
5. Clique em "Create repository"

## Passo 4: Fazer Upload do Projeto para GitHub

### Opção A: Usando Git (Recomendado)

1. Abra o terminal/PowerShell na pasta do projeto
2. Execute:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USERNAME/portal-estagiarios-socem.git
git push -u origin main
```

### Opção B: Usando a Interface do GitHub

1. No repositório que criou, clique em "uploading an existing file"
2. Arraste todos os ficheiros do projeto
3. Clique em "Commit changes"

## Passo 5: Deploy no Vercel

1. Aceda a https://vercel.com
2. Clique em "Sign Up" (ou "Sign In" se já tem conta)
3. Selecione "Continue with GitHub"
4. Autorize o Vercel
5. Clique em "Import Project"
6. Selecione o repositório `portal-estagiarios-socem`
7. Clique em "Import"
8. **Configuração importante:**
   - Framework: **Next.js** (deixe como está)
   - Build Command: `npm run build`
   - Output Directory: `dist`
9. Clique em "Deploy"
10. Aguarde 2-3 minutos
11. **Pronto!** Terá um link público como: `https://portal-estagiarios-socem.vercel.app`

## Passo 6: Acessar o Site

Abra o link que o Vercel lhe forneceu em qualquer navegador, em qualquer lugar do mundo!

---

## ⚠️ Importante: Variáveis de Ambiente

Se o site não funcionar, pode ser porque faltam variáveis de ambiente. Nesse caso:

1. No Vercel, vá para "Settings"
2. Clique em "Environment Variables"
3. Adicione:
   - `DATABASE_URL`: (deixe em branco por enquanto)
   - `JWT_SECRET`: `seu_secret_aqui`
4. Clique em "Save"
5. Clique em "Deployments" e redeploy

---

## 🎉 Sucesso!

Agora tem um site grátis que pode acessar de qualquer lugar!

**Dicas:**
- O site fica online 24/7 (grátis)
- Cada vez que fizer push para GitHub, o Vercel faz deploy automático
- Pode usar em telemóvel, tablet, computador
- Sem limite de utilizadores

Divirta-se! 🚀
