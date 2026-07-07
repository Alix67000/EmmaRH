# EmmaRH - Système d'Information RH pour Emmaüs

## 📖 Présentation
EmmaRH est une application web de gestion des ressources humaines, conçue sur-mesure pour les structures Emmaüs. L'application est 100% in-app (aucune dépendance aux notifications par email) et permet la gestion centralisée des collaborateurs, le suivi des documents avec alertes d'expiration, la validation des absences et offre un tableau de bord complet pour les administrateurs et les managers (filtré par site).

## 🛠️ Stack Technique
- **Frontend** : React 18+, TypeScript, Vite
- **Styling** : Tailwind CSS, Lucide React (icônes)
- **Backend & Auth** : Supabase (PostgreSQL, Authentification)

## ✅ Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- Un compte [Supabase](https://supabase.com/)

---

## 🚀 Étape 1 : Configuration de Supabase
1. Créez un nouveau projet sur Supabase.
2. Allez dans l'onglet **SQL Editor** et exécutez le script SQL d'initialisation pour créer vos tables, vues et RLS (Policies).
3. Allez dans **Authentication** > **Providers** et assurez-vous que l'authentification par **Email** est activée. (Optionnel : Désactivez "Confirm email" pour faciliter les tests).
4. Allez dans **Project Settings** > **API** et notez deux informations essentielles :
   - L'URL du projet (`Project URL`)
   - La clé anonyme (`anon public key`)

---

## 💻 Étape 2 : Installation en local
1. Installez les dépendances du projet :
   ```bash
   npm install
   ```
2. Créez un fichier `.env` à la racine du projet et ajoutez vos clés Supabase :
   ```env
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
   ```
3. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```
   L'application sera accessible sur `http://localhost:3000` (ou le port indiqué par Vite).

---

## ☁️ Étape 3 : Déploiement sur Netlify
Ce projet est configuré pour être déployé facilement sur Netlify.
1. Depuis l'interface Netlify, choisissez "Add new site" > "Import an existing project" et connectez votre dépôt GitHub.
2. Netlify détectera automatiquement la configuration grâce au fichier `netlify.toml` fourni :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
3. Allez dans les paramètres de votre site Netlify (**Site configuration** > **Environment variables**) et ajoutez les deux variables d'environnement requises :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Lancez le déploiement.

---

## 🐙 Étape 4 : Pousser sur GitHub
Pour initialiser votre dépôt local et le pousser sur GitHub, exécutez les commandes suivantes dans votre terminal :

```bash
git init
git add .
git commit -m "init EmmaRH"
git branch -M main
git remote add origin https://github.com/<votre-utilisateur>/emma-rh.git
git push -u origin main
```
*(N'oubliez pas de remplacer `<votre-utilisateur>` par votre vrai nom d'utilisateur GitHub).*
