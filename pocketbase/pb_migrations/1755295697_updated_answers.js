/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3246635500")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = by.id",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_cP9deYld3y` ON `answers` (\n  `by`,\n  `entry`\n)"
    ]
  }, collection)

  // remove field
  collection.fields.removeById("text3069659470")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3246635500")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = by.id && (question ?= @request.body.question && @collection.answers.by ?= @request.auth.id)",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_cP9deYld3y` ON `answers` (\n  `question`,\n  `by`\n)"
    ]
  }, collection)

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3069659470",
    "max": 0,
    "min": 0,
    "name": "question",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
