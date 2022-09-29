---
theme: platformatic
highlighter: prism
lineNumbers: true
favicon: ./assets/favicon.ico
align: center
title: Introducing Platformatic DB
layout: cover
---

# Introducing Platformatic DB

<div class="logo" />
NodeConf.eu 2022


<!--
Do we need the NodeConf logo?
-->

---

# What is Platformatic DB?

Platformatic DB allows you to:

- Create both [**OpenAPI**](https://www.openapis.org) and [**GraphQL**](https://graphql.org) schemas from your database, without having to write a single line of code. 
- All customizable via [**Nodejs**](https://nodejs.org) and [**Fastify**](https://www.fastify.io/) plugins.

<br>

## More Features

- Multiple databases supported: SQLite, MySQL, MariaDB, PostgreSQL
- Multiple authentication methods: JWT, WebHook, HTTP Headers
- Authorization via role based access control

Read more about [Platformatic](https://oss.platformatic.dev/)


---

## Requirements

- [Node.js](https://nodejs.org/) >= v16.17.0 or >= v18.8.0
- [npm](https://docs.npmjs.com/cli/) v7 or later
- A code editor, for example [Visual Studio Code](https://code.visualstudio.com/)
- Basic knowledge of GraphQL

<br>

## Setup

```shell
git clone https://github.com/platformatic/platformatic-db-workshop
npm ci

```

---

## Workshop Structure

- Every step is incremental
- The **final** state of the n-th step is in `steps/step-{n}`.
- We will build a full working backend for a "Movie Quotes App"

---

# Step 1: Initial Setup 1/2 

- Create a folder for the project and the backend:
```shell
mkdir -p movie-quotes/apps/movie-quotes-api/
```

- `cd` into it: 

```shell
cd movie-quotes/apps/movie-quotes-api/

```

- init `npm` and install platformatic:
```shell {1|2|3-4|all}
npm init --yes
npm install platformatic
npm pkg set scripts.start="platformatic db start"
```

---
layout: two-cols
---

# Step 1: Initial Setup 2/2
- Init **platformatic.db**:

```shell
npx platformatic db init
```

- Start **platformatic.db**:

```shell
npm start

```
::right::

<img src="/assets/step-2-run.png" width="350" class="center">

<!--
-->

---

# Check the created **platformatic.db.json** 

```json
{
  "server": {
    "hostname": "127.0.0.1",
    "port": 3042
  },
  "core": {
    "connectionString": "sqlite://./db.sqlite",
    "graphiql": true
  },
  "migrations": {
    "dir": "./migrations"
  },
  "types": {
    "autogenerate": true
  }
}
```

It's possible to use env variables too for the configuration values (next slide)


---
layout: two-cols 
---

- #### All variables MUST be prefixed with `PLT_` 
- #### ...with some (configurable) exceptions:
  #### (`['PORT', 'DATABASE_URL']`)
- #### See [the reference](https://oss.platformatic.dev/docs/reference/configuration/#configuration-placeholders) for more information 

::right::

## `platformatic.db.json`
```json
{
  "server": {
    "logger": {
      "level": "{PLT_SERVER_LOGGER_LEVEL}"
    },
    "hostname": "{PLT_SERVER_HOSTNAME}",
    "port": "{PORT}"
  },
  "core": {
    "connectionString": "{DATABASE_URL}"
  },
  "migrations": {
    "dir": "./migrations"
  }
}

```

## `.env`
```shell
PORT=3042
PLT_SERVER_HOSTNAME=127.0.0.1
PLT_SERVER_LOGGER_LEVEL=info
DATABASE_URL=sqlite://./movie-quotes.sqlite
```

---

# Step 2: Create DB schema (1/3)

- Migrate `db.sqlite` back (or you can remove the `db.sqlite` file):
```shell
npx platformatic db migrate --to 000
```

- The reason is that this has been created by default migrations created with `platformatic db init`. 

- Now we want to specify our own DB schema.

- Edit `./migrations/001.do.sql` to be:
```sql
CREATE TABLE quotes (
  id INTEGER PRIMARY KEY,
  quote TEXT NOT NULL,
  said_by VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

<!--
NOTE that `npx platformatic db migrate --to 000` won't work until we fix: https://github.com/platformatic/platformatic/issues/44 
-->
---

# Step 2: Create DB schema (2/3)
- Remember to change `001.undo.sql` too:

```sql 

DROP TABLE quotes;
```
- Then, stop and run Platformatic DB again: 
```shell
npm start
```
---

# Step 2: Create DB schema (3/3) 

- Note that migration `001.do.sql` is applied: 

<img src="/assets/step-2-run.png" width="350" class="center">

Platformatic is now exposing the 'quotes' entity through GraphQL and OpenAPI!
 
---

# GraphiQL

http://localhost:3042/graphiql



<img src="/assets/step-2-graphiql.png" width="600" class="right">


---

# OpenApi

http://localhost:3042/documentation/static/index.html

<img src="/assets/step-2-openapi.png" width="500" class="left">


---

# Step 3: Add Relationship 

- Create `./migrations/002.do.sql`:
```sql
CREATE TABLE movies (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

ALTER TABLE quotes ADD COLUMN movie_id INTEGER REFERENCES movies(id);
```

- ...and `002.undo.sql`:

```sql
ALTER TABLE quotes DROP COLUMN movie_id;
DROP TABLE movies;
```

- Stop and start Platformatic DB:

```shell {1}
[17:52:03.881] INFO (94146): running 002.do.sql
[17:52:04.066] INFO (94146): server listening
    url: "http://127.0.0.1:3042"
```
---

# Step 3: Add Relationship 

Open GraphiQL and try to create a movie:

```graphql
mutation {
  saveMovie(input: { name: "The Wizard of Oz" }) {
    id
  }
}

```
And (assuming `movieId` is 1): 

```graphql
mutation {
  saveQuote(
    input: {
      quote: "Toto, I've got a feeling we're not in Kansas anymore", 
      movieId: 1, 
      saidBy: "Dorothy Gale"}
  ) {
    id
    quote
  }
}
```

---

# Step 3

- Query data

<img src="/assets/step-3-query.png" width="600" class="left">


---

# BONUS: Get GraphQL schema

- The GraphQL schema can be extracted with:

```shell
npx platformatic db schema graphql >> schema.sdl

```

```shell
cat schema.sdl     
type Query {
  getQuoteById(id: ID!): Quote
  quotes(limit: Int, offset: Int, orderBy: [QuoteOrderByArguments], where: QuoteWhereArguments): [Quote]
  getMovieById(id: ID!): Movie
  movies(limit: Int, offset: Int, orderBy: [MovieOrderByArguments], where: MovieWhereArguments): [Movie]
}
(...)
```

- Some code generators that can process it:
  - https://www.the-guild.dev/graphql/codegen
  - https://github.com/apollographql/apollo-tooling

<!-- 
Link to generators from schema 
-->

---

# Step 4: Seed the Database

- #### The `platformatic db seed` command allow to run a script that populates the DB.
- #### The script needs to export a function: 

```js
'use strict'
module.exports = async function ({ entities, db, sql }) {
  await entities.graph.save({ input: { name: 'Hello' } })
  await db.query(sql`
    INSERT INTO graphs (name) VALUES ('Hello 2');
  `)
}
```

- #### Where:
  - #### `db` - A database abstraction layer from [@databases](https://www.atdatabases.org/)
  - #### `sql` - The SQL builder from [@databases](https://www.atdatabases.org/)
  - #### `entities` - An object containing a key for each table found in the schema, with basic CRUD operations.
---

# seed.js (1/2)

```js

const quotes = [
  {
    quote: "Toto, I've got a feeling we're not in Kansas anymore.",
    saidBy: 'Dorothy Gale',
    movie: 'The Wizard of Oz'
  },
  {
    quote: "You're gonna need a bigger boat.",
    saidBy: 'Martin Brody',
    movie: 'Jaws'
  },
  {
    quote: 'May the Force be with you.',
    saidBy: 'Han Solo',
    movie: 'Star Wars'
  },
  {
    quote: 'I have always depended on the kindness of strangers.',
    saidBy: 'Blanche DuBois',
    movie: 'A Streetcar Named Desire'
  }
]

```

---

# seed.js (2/2)

```js

module.exports = async function ({ entities, db, sql }) {
  for (const values of quotes) {
    const movie = await entities.movie.save({ input: { name: values.movie } })

    console.log('Created movie:', movie)

    const quote = {
      quote: values.quote,
      saidBy: values.saidBy,
      movieId: movie.id
    }

    await entities.quote.save({ input: quote })

    console.log('Created quote:', quote)
  }
}

```

---

# Step 4: apply the seed
- To start from a clean slate, we need to reset the db first, so we can migrate to initial state (the undo scripts will drop the tables). Removing `db.sqlite` also works. 
```shell
npx platformatic db migrate --to 000
```

- Then run migrations: 
```shell
npx platformatic db migrate
```

- ...and seed: 
```shell
npx platformatic db seed seed.js
```

---

# Step 5: Build a "like" quote feature

- Create and apply this migration (remember the `undo` script): 
```sql
ALTER TABLE quotes ADD COLUMN likes INTEGER default 0;
```

- Check `plugin.js`:

```js
module.exports = async function plugin (app) {
  app.log.info('plugin loaded')
}
```

- ...and the configuration in `platformatic.db.json`:

```json{6-8}
{
  ...
  "migrations": {
    "dir": "./migrations"
  },
  "plugin": {
    "path": "./plugin.js"
  }
}

```

<!-- 
Here we will have plugin.js and config that are generated on the first migration (instead of during `init`). 
See: https://github.com/platformatic/platformatic/issues/55
-->

---

# Step 5: Plugins 

- Platformatic DB can be extended with [**Fastify Plugins**](https://www.fastify.io/docs/latest/Reference/Plugins/)
- When Platformatic DB starts, loads the plugins: 

```shell {2}
[10:09:20.052] INFO (146270): running 003.do.sql
[10:09:20.129] INFO (146270): plugin loaded
[10:09:20.209] INFO (146270): server listening
    url: "http://127.0.0.1:3042"
```

---

 
## "like quote" with REST 
- #### Install `npm i fluent-json-schema`
- #### ...use it in `plugin.js`:


```js {1,5-17}
const S = require('fluent-json-schema')
module.exports = async function plugin (app) {
  app.log.info('plugin loaded')

  const schema = {
    params: S.object().prop('id', app.getSchema('Quote').properties.id)
  }

  app.post('/quotes/:id/like', { schema }, async function (request, response) {
    const { db, sql } = app.platformatic

    const result = await db.query(sql`
      UPDATE quotes SET likes = likes + 1 WHERE id=${request.params.id} RETURNING likes
    `)

    return result[0]?.likes
  })
}

```

#### `curl --request POST http://localhost:3042/quotes/1/like`

---

# Step 6: `likeQuote` mutation

- We can extract a `incrementQuoteLikes` function for reuse in `plugin.js`: 

```js{5-13,18-20} 
const S = require('fluent-json-schema')
module.exports = async function plugin (app) {
  app.log.info('plugin loaded')

  async function incrementQuoteLikes (id) {
    const { db, sql } = app.platformatic

    const result = await db.query(sql`
      UPDATE quotes SET likes = likes + 1 WHERE id=${id} RETURNING likes
    `)

    return result[0]?.likes
  }
  const schema = {
    params: S.object().prop('id', app.getSchema('Quote').properties.id)
  }

  app.post('/quotes/:id/like', { schema }, async function (request, response) {
    return { likes: await incrementQuoteLikes(request.params.id) }
  })
}
```

---

# Add a GraphQL Resolver for incrementing likes

```js {5-15}

module.exports = async function plugin (app) {
  // ...

  app.graphql.extendSchema(`
    extend type Mutation {
      likeQuote(id: ID!): Int
    }
  `)

  app.graphql.defineResolvers({
    Mutation: {
      likeQuote: async (_, { id }) => await incrementQuoteLikes(id)
    }
  })
}

```

- Try the mutation with GraphiQL

---

# Step 7: Setup UI

- Copy from `./steps/07-ui/movie-quotes/apps/movie-quotes-frontend`

- In the frontend folder, run:
```shell
npm install
npm start
```

This should start: 
```shell {8}
➜ npm start  

> start
> astro dev --port 3000

  🚀  astro  v1.3.1 started in 38ms
  
  ┃ Local    http://localhost:3000/
  ┃ Network  use --host to expose
```
<!--
Apparently, `vite` starts on http://localhost:3000/ on linux, and  http://127.0.0.1:3000/ on others
-->
---

# Step 7: Setup CORS

- On server setup CORS in `platformatic.db.json` using the same local URL:


```json{5-7}
{
  "server": {
    "hostname": "127.0.0.1",
    "port": 3042
    "cors": {
      "origin": "http://localhost:3000"
    }
  },
  ...
}
```

- Restart the Platformatic DB server

<!--
BONUS STEP.
 The presenter must have all running on the laptop.
-->

---
layout: two-cols
---


# Open with the browser 

::right::
<img src="/assets/step-7-ui.png" width="400" class="center">

---

# Next Steps 

- Add security integrating with a third party authentication service (like [Auth0](https://auth0.com/), see how [here](https://oss.platformatic.dev/docs/next/guides/jwt-auth0)).
- Add authorizations at API level (see [references](https://oss.platformatic.dev/docs/next/reference/db-authorization/introduction))
- Generate [TypeScript](https://www.typescriptlang.org/) types 

<!-- 
Others??
-->

---

# Thanks!!!!! 👋

<div class="logo" /> 

- https://oss.platformatic.dev/
- https://blog.platformatic.dev/
- <carbon-logo-github /> https://github.com/platformatic
- <carbon-logo-discord /> https://discord.gg/platformatic 
- <carbon-logo-twitter /> https://twitter.com/platformatic
