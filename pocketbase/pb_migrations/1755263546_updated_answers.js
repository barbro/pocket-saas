/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3246635500")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = by.id",
    "updateRule": "@request.auth.id = by.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3246635500")

  // update collection data
  unmarshal({
    "createRule": null,
    "updateRule": null
  }, collection)

  return app.save(collection)
})
