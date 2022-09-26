---
theme: slidev-theme-platformatic
highlighter: shiki
lineNumbers: true
favicon: ./assets/favicon.ico
align: center
title: Introducing Platformatic DB
layout: cover
---

# Introducing Platformatic DB

<img src="/assets/plt-logo.svg" width="200" height="200" class="center">
NodeConf.eu 2022


<div class="logo" />


<div class="abs-br m-6 flex gap-2">
  <a href="https://github.com/platformatic/platformatic" target="_blank" alt="GitHub"
    class="text-xl icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>

<!--
Do we need the NodeConf logo?
-->

---

# What is Platformatic DB?


Platformatic DB allows you to:

- Create both OpenAPI and GraphQL schemas from your database, without having to write a single line of code. 
- All customizable via Node.js and Fastify plugins.

<br>
<br>

Read more about [Platformatic](https://oss.platformatic.dev/)

<!--
just a draft
-->

---

# Features

- Automatic OpenAPI/REST API generation
- Automatic GraphQL API generation
- Multiple databases: SQLite, MySQL, MariaDB, PostgreSQL
- Multiple authentication methods: JWT, WebHook, HTTP Headers
- Authorization via role based access control
- Customizable via Node.js and [Fastify](https://www.fastify.io/) plugins

<br>
<br>

<!--
just a draft
-->
---

## Requirements

- [Node.js](https://nodejs.org/) >= v16.17.0 or >= v18.8.0
- [npm](https://docs.npmjs.com/cli/) v7 or later
- A code editor, for example [Visual Studio Code](https://code.visualstudio.com/)
- Basic knowledge of GraphQL

## Setup

```bash
git clone https://github.com/platformatic/platformatic-db-workshop
npm ci

```

## 

<br>
<br>

---

# Workshop Structure

- Every step is incremental
- The final state of the n-th step is in `steps/step-{n}`

---

# Step 1: Initial Setup 1/2 

- Create a folder for the project and the backend:
```shell {1|3|all}
mkdir -p movie-quotes/apps/movie-quotes-api/

cd movie-quotes/apps/movie-quotes-api/

```

- init `npm` and install platformatic:
```shell {1|2|3-5|all}
npm init --yes
npm install platformatic
npm pkg set scripts.db="platformatic db"
npm pkg set scripts.start="npm run db start"
npm pkg set scripts.dev="npm start"

```

---
layout: two-cols
---

# Step 1: Initial Setup 2/2
- Init **platformatic.db**:

```shell
npm run db init

```

- Start **platformatic.db**:

```shell
npm start

```
::right::

<img src="/assets/step-2-run.png" width="350" class="center">

<!--
I prefer to use`db --init` instead of having people trying to copy a base configuration(which is time consuming and error-prone)
-->

---
layout: two-cols
---
## Open and check the created **platformatic.db.json** 

::right::
```json
{
  "server": {
    "logger": {
      "level": "info"
    },
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

<!--
Here we can add, as `bonus` to use `.env`
-->
---

# Bonus - Use `.env`

[TODO]


---


# Step 2: Create DB schema (1/2)

- Remove `db.sqlite`:
```shell
rm db.sqlite
```

The reason is that this has been created by default migrations created with `platformatic db init`. Now we want to specify our own DB schema.


- Edit `./migrations/001.do.sql` to be just:
```sql
CREATE TABLE quotes (
  id INTEGER PRIMARY KEY,
  quote TEXT NOT NULL,
  said_by VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

- Run platformatic db again: 
```shell
npm run dev
```
---

# Step 2: Create DB schema (2/2) 

- Note that migration `001.do.sql` is applied: 

<img src="/assets/step-2-run.png" width="350" class="center">

Platformatic is now exposing the 'quotes' entity through GraphQL and OpenAPI!
 
---

# GraphiQL

http://localhost:3042/graphiql



<img src="/assets/step-2-graphiql.png" width="600" class="right">
<!--
TODO: fix layout and image size
-->

---


# OpenApi

http://localhost:3042/documentation/static/index.html

<img src="/assets/step-2-openapi.png" width="500" class="left">

<!--
TODO: fix layout and image size
-->
---

# Step 3: Add Relationship 

- Create **./migrations/002.do.sql**:
```sql
CREATE TABLE movies (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

ALTER TABLE quotes ADD COLUMN movie_id INTEGER REFERENCES movies(id);
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

Query data
<img src="/assets/step-3-query.png" width="600" class="left">


---

# BONUS: Get GraphQL schema

```shell
npm run db schema graphql >> schema.sdl

cat schema.sdl     
type Query {
  getQuoteById(id: ID!): Quote
  quotes(limit: Int, offset: Int, orderBy: [QuoteOrderByArguments], where: QuoteWhereArguments): [Quote]
  getMovieById(id: ID!): Movie
  movies(limit: Int, offset: Int, orderBy: [MovieOrderByArguments], where: MovieWhereArguments): [Movie]
}

type Quote {
  id: ID
  quote: String
  saidBy: String
  createdAt: String
  movie: Movie
}

type Movie {
  id: ID
  name: String
  quotes(limit: Int, offset: Int, orderBy: [QuoteOrderByArguments], where: QuoteWhereArguments): [Quote]
}
(...)
```

---

# Step 4: Seed the Database

- The `platformatic db seed` command allow to run a script that populates the DB.
- `seed.js` needs to export a function: 


```js
'use strict'

module.exports = async function ({ entities, db, sql }) {
  await entities.graph.save({ input: { name: 'Hello' } })
  await db.query(sql`
    INSERT INTO graphs (name) VALUES ('Hello 2');
  `)
}

```

<!--
Maybe we can skip the "seed" part
-->

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
- We need to remove the db first: 
```shell 
rm db.sqlite
```
- Then run migrations: 
```shell
npm run db migrate
```
- ...and the seed: 
```shell
npm run db seed seed.js
```

---

# Step 5: Build a "like" quote feature

- Create and apply this migration: 
```sql
ALTER TABLE quotes ADD COLUMN likes INTEGER default 0;
```

- Create `plugin.js`:

```js
module.exports = async function plugin (app) {
  app.log.info('plugin loaded')
}
```

- ...and setup in `platformatic.db.json`:

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
I think we should do this before moving to UI, because otherwise the risk is that we don't have time to show how to extend Platformatic DB. 
Also, people should do the migration and apply by themselves (they already have all the info)
-->

---

# Step 5: Plugins 

- Platformatic DB can be extended with **Fastify Plugins**
- When starting, plugins are loaded: 

```shell {2}
[10:09:20.052] INFO (146270): running 003.do.sql
[10:09:20.129] INFO (146270): plugin loaded
[10:09:20.209] INFO (146270): server listening
    url: "http://127.0.0.1:3042"
```

--- 

- Install `npm i fluent-json-schema`

- ...use it:

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

`curl --request POST http://localhost:3042/quotes/1/like`


---

# Step 6: `likeQuote` mutation

- We can refactor out a `incrementQuoteLikes` from reuse: 

```js{6-14,19-21} 
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

# Add the resolver

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
