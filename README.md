# Glow Dental — Catalogue 2026

Catalogue mobile de matériel et consommables dentaires (284 produits) avec commande via WhatsApp.
72 Rue Bni Drar, Tabriquet, Salé.

## Fichiers

- `index.html` + `app.js` : le site. Les réglages (numéro WhatsApp, lien Apps Script) sont dans `CONFIG` en haut de `app.js`.
- `data/products.json` : les produits (nom, catégorie, prix, options). Utilisé tant que la Google Sheet n'est pas reliée.
- `img/` : une photo par produit (`<id>.webp`).
- `admin.html` : espace admin (commandes, statuts, prix, disponibilité, stats). Lien Apps Script dans `CONFIG` en haut du fichier.
- `backend/Code.gs` : backend Google Apps Script relié à une Google Sheet (feuilles Produits, Commandes, Clients).
- `print/` : affiche A4 et sticker avec QR code vers le catalogue.

## Workflow d'une commande

1. Le client scanne le QR code → catalogue → ajoute au panier.
2. Il remplit ses coordonnées → la commande est enregistrée dans la Sheet avec un numéro `GD-AAMMJJ-001`.
3. WhatsApp s'ouvre avec la commande prête → le client appuie sur Envoyer.
4. Vous recevez la notification (email / WhatsApp CallMeBot / ntfy) → vous changez le statut dans l'admin :
   nouvelle → confirmée → en livraison → livrée (ou annulée).
5. Le client suit le statut dans « Mes commandes » et peut recommander en 1 clic.

## Relier la Google Sheet (une seule fois)

Voir les étapes en haut de `backend/Code.gs`. Ensuite, copier le lien `/exec` dans `app.js` et `admin.html`,
et changer `ADMIN_PIN` directement dans Apps Script (jamais dans ce repo, il est public).
