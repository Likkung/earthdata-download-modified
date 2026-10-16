exports.up = async (knex) => {
  await knex.schema.alterTable('preferences', (table) => {
    table.text('fileExtensions').notNullable().defaultTo('')
    table.boolean('autoRetry').notNullable().defaultTo(true)
  })
  await knex.schema.alterTable('downloads', (table) => {
    table.text('fileExtensions').notNullable().defaultTo('')
  })
  await knex.schema.alterTable('files', (table) => {
    table.text('resumeData')
    table.integer('retryCount').notNullable().defaultTo(0)
    table.bigInteger('nextRetryAt').notNullable().defaultTo(0)
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('files', (table) => {
    table.dropColumns('resumeData', 'retryCount', 'nextRetryAt')
  })
  await knex.schema.alterTable('downloads', (table) => table.dropColumn('fileExtensions'))
  await knex.schema.alterTable('preferences', (table) => table.dropColumns('fileExtensions', 'autoRetry'))
}
