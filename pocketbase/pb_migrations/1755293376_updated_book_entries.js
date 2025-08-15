/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3913342805")

  // update collection data
  unmarshal({
    "listRule": "",
    "viewRule": ""
  }, collection)

  // update field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "number3146699310",
    "max": 12,
    "min": 1,
    "name": "step_number",
    "onlyInt": false,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "number2845901802",
    "max": null,
    "min": null,
    "name": "entry_number",
    "onlyInt": false,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "json4274335913",
    "maxSize": 0,
    "name": "content",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3913342805")

  // update collection data
  unmarshal({
    "listRule": null,
    "viewRule": null
  }, collection)

  // update field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "number3146699310",
    "max": 12,
    "min": 1,
    "name": "step_number",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "number2845901802",
    "max": null,
    "min": null,
    "name": "entry_number",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "json4274335913",
    "maxSize": 0,
    "name": "content",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
})
