# Paroisse Saint-Nicolas du Rhône

Site de la paroisse pour [stnicolasdurhone.fr](https://stnicolasdurhone.fr).

Le site public est une application Angular. Les pages sont rendues côté serveur, pour que Google lise le contenu. Elle est aussi installable comme application (horaires, textes et images mis en cache). Les textes, horaires et messages se modifient dans une administration, enregistrée par une API NestJS dans une base SQLite.

## Lancer en local

Deux terminaux, depuis la racine du projet :

```bash
npm run dev:api
npm run dev:web
```

Ou les deux ensemble : `npm run dev`.

- Site : http://localhost:4200
- API : http://localhost:3000
- Administration : http://localhost:4200/admin/connexion

Première connexion :

- adresse : `pbernard.jobert@yahoo.fr`
- mot de passe : la valeur de `ADMIN_PASSWORD` dans `apps/api/.env` (à définir avant `npm run db:setup`)

Changez ce mot de passe depuis **Mon profil** (avatar ou nom dans Utilisateurs), avant toute mise en ligne. La double authentification et les clés d’accès (Bitwarden, 1Password, trousseau de l’appareil) se gèrent au même endroit. Après l’ajout d’une clé d’accès, le profil propose de se connecter uniquement avec elle : le mot de passe et la double authentification sont alors désactivés, et peuvent être réactivés plus tard.

## Ce que l’administration permet

- actualités
- agenda
- horaires des messes
- communes et églises
- équipe
- sacrements et vie paroissiale
- coordonnées, liens et textes d’introduction
- utilisateurs
- messages envoyés par le formulaire de contact

## Base de données

Le fichier est `apps/api/dev.db`. Pour le recréer à partir du contenu d’origine :

```bash
npm run db:setup
```

Cette commande ne réécrit pas les contenus déjà présents. Elle crée le compte d’administration s’il n’existe pas.

## Mettre en ligne

```bash
npm run build
```

Deux programmes doivent tourner sur le serveur :

- l’API : `npm run start:prod --prefix apps/api` (port 3000)
- le site : `npm run serve:ssr:web --prefix apps/web` (port 4000)

Le serveur du site doit connaître l’API :

```bash
API_ORIGIN=http://127.0.0.1:3000 npm run serve:ssr:web --prefix apps/web
```

Les PDF des feuilles de semaine et du mois sont enregistrés dans `apps/api/uploads`. Conservez ce dossier lors des mises à jour. Le proxy doit accepter des envois d’au moins 15 Mo.

Un reverse proxy envoie le domaine vers ces deux ports. Exemple :

```nginx
location /api/ {
  client_max_body_size 16m;
  proxy_pass http://127.0.0.1:3000;
}
location / {
  proxy_pass http://127.0.0.1:4000;
}
```

Indiquez ensuite le nom de l’hébergeur dans l’administration, champ « Hébergeur ». Il apparaît dans les mentions légales.

Avant la mise en ligne, remplacez `JWT_SECRET` dans `apps/api/.env` par une longue chaîne aléatoire, et changez le mot de passe d’administration. Pour les clés d’accès, indiquez `WEBAUTHN_RP_ID=stnicolasdurhone.fr` et `WEBAUTHN_ORIGIN=https://stnicolasdurhone.fr`. En local, elles fonctionnent sur `http://localhost:4200`.
