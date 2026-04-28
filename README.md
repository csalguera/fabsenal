# Fabsenal

Fabsenal is a Flesh and Blood deck-building app built with Next.js, React, TypeScript, MongoDB, Firebase Auth, AWS S3, GSAP, and Lucide React.

## Features

- Browse a large a assortment of cards for the Trading Card Game (TCG) _Flesh and Blood_
- Build decks for the Silver Age and Classic Constructed formats with legality checks
- Render card data with type-aware stat rules so only relevant values appear.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- MongoDB
- Firebase Auth
- AWS S3
- GSAP
- Lucide React

## Running Locally

```bash
npm install
npm run dev
```

For verification:

```bash
npm run lint
npm run build
```

## Environment Variables

Create a `.env` file with these variables:

- `DATABASE_URL`
- `MONGODB_DB`
- `AWS_REGION`
- `AWS_S3_BUCKET_NAME`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `ADMIN_EMAIL`

## App Routes

### Pages

- `/` - landing page
- `/cards` - searchable card gallery
- `/cards/add` - add a new card (protected route)
- `/cards/[id]/view` - view a card
- `/cards/[id]/edit` - edit a card (protected route)
- `/decks` - public index of all decks with creators
- `/decks/my-decks` - personal deck management (protected route)
- `/decks/add` - create a deck
- `/decks/[id]/edit` - edit or view a deck

### API Endpoints

- `GET /api/cards` - list cards with search/filter/pagination
- `GET /api/cards?id=...` - fetch a single card
- `POST /api/cards` - create a card
- `PUT /api/cards` - update a card
- `DELETE /api/cards?id=...` - delete a card

- `GET /api/decks?scope=public` - list public decks for the public index
- `GET /api/decks?scope=mine` - list the signed-in user's decks for the personal deck page
- `POST /api/decks` - create a deck or duplicate an existing deck
- `DELETE /api/decks?id=...` - delete a deck

- `POST /api/uploads` - upload a card image to S3
- `GET /api/auth/me` - resolve the current authenticated session

## Card Data Rules

- Main deck cards render cost, pitch, color, power, and defense unless their type or rarity says otherwise.
- Allies render life instead of defense.
- Actions, Defense Reactions, Blocks, and Instants do not render power.
- Instants and Resources do not render defense.
- Resources do not render cost.
- Equipment, Weapon, Hero, and Demi-Hero cards do not render pitch, cost, or color.
- Weapon cards do not render defense.
- Equipment cards do not render power.
- Hero and Demi-Hero cards do not render power or defense.
- Basic and Token rarity cards are treated as token-like for deckbuilding limits.

## Notes

- Card searches in the cards page are filterable by the supported stat and classification fields.
- Multi-select filters for class, talent, and functional subtype use AND logic.
- Decks can be marked public or private. Public decks appear on the `/decks` index for all users to discover and copy.
- Deck creators are identified by their email username on public deck listings (everything before the @ symbol).
- Copying a public deck reuses the existing personal copy if one already exists, so `/decks/my-decks` shows a single instance.
