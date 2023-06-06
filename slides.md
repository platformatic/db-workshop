---
theme: platformatic
highlighter: prism
lineNumbers: true
favicon: ./assets/favicon.ico
css: unocss
align: center
title: Introducing Platformatic DB
layout: cover
---

# Introducing Platformatic DB

<div class="logo" />

[https://platformatic.dev/db-workshop](https://platformatic.dev/db-workshop)

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
git clone https://github.com/platformatic/db-workshop.git

```

<!---
We don't need to npm install because they just need the steps
-->
---

## Workshop Structure

- Every step is incremental
- The **final** state of the n-th step is in `steps/step-{n}`.
- We will build a full working backend for a "Movie Quotes App"

---

# Step 1: Initial Setup 1/3

- Create a folder for the project and the backend:
```shell
mkdir -p movie-quotes/apps/movie-quotes-api/
```

- `cd` into it:

```shell
cd movie-quotes/apps/movie-quotes-api/

```

- init `npm` and create a platformatic project:

```shell
npx create-platformatic@latest  

```

---

# Step 1: Initial Setup 2/3

<img src="/assets/step-1-create.png" heigth="550" class="center">


---

# Step 1: Initial Setup 3/3

- Start **platformatic.db**:

```shell
npm start

```


<img src="/assets/step-1-run.png"  class="center">

<!--
-->

---

# Check the created **platformatic.db.json**

```json
{
  "$schema": "https://platformatic.dev/schemas/v0.19.2/db",
  "server": {
    "hostname": "{PLT_SERVER_HOSTNAME}",
    "port": "{PORT}",
    "logger": {
      "level": "{PLT_SERVER_LOGGER_LEVEL}"
    }
  },
  "db": {
    "connectionString": "{DATABASE_URL}",
    "graphql": true,
    "openapi": true
  },
  "migrations": {
    "dir": "migrations"
  },
  "plugins": { // (...)
  },
  "types": {
    "autogenerate": true
  }
}
```

Note that platformatic uses `env` variables for the configuration.


---
layout: two-cols
---

- #### All variables MUST be prefixed with `PLT_`
- #### ...with some (configurable) exceptions:
  #### (`['PORT', 'DATABASE_URL']`)
- #### See [the reference](https://oss.platformatic.dev/docs/reference/db/configuration#environment-variable-placeholders) for more information
- #### We added the mandatory `PLT_` prefix to prevent accidental exposure of API keys.

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
  "db": {
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
DATABASE_URL=sqlite://./db.sqlite
```

---

# GraphiQL

http://localhost:3042/graphiql



<img src="/assets/step-1-graphiql.png" width="650" class="right">


---

# OpenApi

http://localhost:3042/documentation

<img src="/assets/step-1-openapi.png" width="650" class="left">


---

# Step 2: Create DB schema (1/3)

- Migrate `db.sqlite` back (or you can remove the `db.sqlite` file):
```shell
npx platformatic db migrations apply --to 000
```

- Now we want to specify our own DB schema, edit `./migrations/001.do.sql` to be:
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

- Apply the migrations:
```bash
npx platformatic db migrations apply 

```

- You can now reload your GraphiQL and OpenAPI pages and you will
  automatically see the updated schemas.

---

# Step 2: Create DB schema (3/3)

- Note that migration `001.do.sql` is applied:

<img src="/assets/step-2-run.png" width="600" class="center">

Platformatic is now exposing the 'quotes' entity through GraphQL and OpenAPI!

---

# GraphiQL

http://localhost:3042/graphiql


<img src="/assets/step-2-graphiql.png" width="600" class="right">

---

# OpenApi

http://localhost:3042/documentation

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

- Apply the new migration (the server will restart automatically):

```bash
npx platformatic db migrations apply
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
  - https://github.com/horiuchi/dtsgenerator

<!--
Link to generators from schema
-->

---

# Step 4: Seed the Database

- #### The `platformatic db seed` command allow to run a script that populates the DB.
- #### The script needs to export a function, like this example:

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
- You might want to reset the database to a clean slate by migrating to initial state (the undo scripts will drop the tables). Removing `db.sqlite` also works.
```shell
npx platformatic db migrations apply --to 000
```

- Then run migrations:
```shell
npx platformatic db migrations apply
```

- ...and seed:
```shell
npx platformatic db seed seed.js
```

---

# Step 5: Build a "like" quote feature

- Create a new migration (remember the `undo` script):
```sql
ALTER TABLE quotes ADD COLUMN likes INTEGER default 0;
```

- Apply the migration:

```bash
npx platformatic db migrations apply

```

- Check `plugin.js`:

```js
module.exports = async function (app) {}
```

- ...and the configuration in `platformatic.db.json`:

```json{2-7}
  ...
  "plugins": {
    "paths": [
      "plugin.js"
    ]
  }

```

<!--
Here we will have plugin.js and config that are generated on the first migration (instead of during `init`).
See: https://github.com/platformatic/platformatic/issues/55
-->

---

# Step 5: Plugins

- Platformatic DB can be extended with [**Fastify Plugins**](https://www.fastify.io/docs/latest/Reference/Plugins/)
- When Platformatic DB starts, loads the plugins (try adding a `app.log.info` in `plugin.js`):

```javascript{2}
module.exports = async function (app) {
  app.log.info('plugin loaded')
}
```
See the log on the server:

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


```js {1,4-16}
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

```js{4-12,16-18}
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
---

# Try the mutation with GraphiQL

<img src="/assets/step-6-mutation.png" class="center">

<!--
mutation {
  likeQuote(id: 1)
}
-->

---

# Step 7: Setup UI
- Remember you cloned the workshop? Grab `./steps/07-ui/movie-quotes/apps/movie-quotes-frontend` and copy the folder `movie-quotes-frontend` aside `movie-quotes-api`

- In the frontend folder, run:
```shell
npm install
npm start
```

You should see this:
```shell {8}
➜ npm start  

> start
> astro dev --port 3000

  🚀  astro  v1.9.2 started in 72ms
  
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

- ~~Restart the Platformatic DB server~~ (not needed! 🎉)

<!--
BONUS STEP.
 The presenter must have all running on the laptop.
-->

---

# Step 7: Open with the browser

<img src="/assets/step-7-ui.png" width="500" class="center">

---


# Step 8: Deploy on Platformatic Cloud

- Point your browser to https://platformatic.cloud
- Login with github (you may beed to accept the terms and conditions if not done yet)
- You should see the **Dashboard** page on your personal organization, which is created automatically. Click on "Create an App"

<div flex justify-center m-4>
    <img src="/assets/step-8-org.png" width="400"/>
</div>
---

# Step 8: Create an Application

<div flex justify-center m-4>
    <img src="/assets/step-8-create-app.png"/>
</div>

---

# Step 8: Create a Workspace

<div flex justify-center m-4>
    <img src="/assets/step-8-workspace.png"/>
</div>

---

# Step 8: Workspace ID and Key

<div flex justify-center m-4>
    <img src="/assets/step-8-workspace-ids.png"/>
</div>

---

# Step 8: Download the Workspace env

- You can also download the `env` file with both workspaceId and the key. 
- The file is called `${workspace-name}.plt.txt`
- Save it in `movie-quotes/apps/movie-quotes-api` folder in your project

<div flex justify-center m-4>
    <img src="/assets/step-8-workspace-ids-2.png" width="500"/>
</div>

---

# Step 8: Now the Workspace is ready!

<div flex justify-center m-4>
    <img src="/assets/step-8-workspace-ready.png"/>
</div>

---

# Step 8: Deploy using the CLI 

- Go in the `movie-quotes-api` folder:
```bash
 cd ./movie-quotes/apps/movie-quotes-api 
```

- Launch the deployment:

```bash
npx platformatic deploy --keys=./test-workspace-demo.plt.txt
```

<div flex justify-center m-4>
    <img src="/assets/step-8-deploy.png"/>
</div>

---

# Step 8: Check the deployment:

<div flex justify-center m-4>
    <img src="/assets/step-8-deploy-ok.png" width="800"/>
</div>

---

# Step 8: Test the deployment:

```bash
curl https://gorgeous-vacuous-young-chalk.deploy.space/quotes
```


<div flex justify-center m-4>
    <img src="/assets/step-8-deploy-test.png" width="500"/>
</div>


---

# Step 8: Connect the UI to the deployed API 

- Open `movie-quotes/apps/movie-quotes-frontend/.env` and change `PUBLIC_GRAPHQL_API_ENDPOINT` to the deployed API endpoint (use the actual URL):


```js
PUBLIC_GRAPHQL_API_ENDPOINT=https://gorgeous-vacuous-young-chalk.deploy.space/graphql
```

- Restart the frontend dev server and check the UI is still working

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
