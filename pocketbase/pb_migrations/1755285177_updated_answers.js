/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3246635500")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = by.id && (question ?= @request.body.question && @collection.answers.by ?= @request.auth.id)",
    "indexes": []
  }, collection)

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation1070322242",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "by",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3246635500")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = by.id",
    "indexes": [
      "CREATE INDEX `idx_ZkBJsEXZDQ` ON `answers` (\n  `question`,\n  `by`\n)"
    ]
  }, collection)

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation1070322242",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "by",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
