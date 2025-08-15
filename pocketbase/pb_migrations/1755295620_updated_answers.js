/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3246635500")

  // add field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3913342805",
    "hidden": false,
    "id": "relation723623280",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "entry",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3246635500")

  // remove field
  collection.fields.removeById("relation723623280")

  return app.save(collection)
})
