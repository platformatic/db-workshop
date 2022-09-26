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
