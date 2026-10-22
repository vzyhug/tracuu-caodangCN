// From the project root:
// mongosh "mongodb://localhost:27017/tkb_sinh_vien" --file mongodb/import.js
// Uses the selected database; does not drop collections or delete documents.
const fs = require('node:fs');
const path = require('node:path');
const importDirectory = path.resolve('mongodb');
const imports = [
  ['mon_hoc', doc => ({ _id: doc._id })],
  ['sinh_vien', doc => ({ _id: doc._id })],
  ['tkb', doc => ({ maLop: doc.maLop, maMon: doc.maMon, hocKy: doc.hocKy, namHoc: doc.namHoc })],
];
// Validate every input file before writing anything.
const datasets = imports.map(([name, filter]) => {
  const documents = JSON.parse(fs.readFileSync(path.join(importDirectory, name + '.json'), 'utf8'));
  if (!Array.isArray(documents) || !documents.length) throw Error('Invalid JSON array: ' + name);
  const keys = documents.map(doc => JSON.stringify(filter(doc)));
  if (new Set(keys).size !== keys.length) throw Error('Duplicate import keys: ' + name);
  return { name, filter, documents };
});
load(path.join(importDirectory, 'indexes.js'));
for (const { name, filter, documents } of datasets) {
  const result = db.getCollection(name).bulkWrite(documents.map(doc => ({
    replaceOne: { filter: filter(doc), replacement: doc, upsert: true },
  })));
  print(name + ': ' + documents.length + ' documents; upserted=' + result.upsertedCount + ', matched=' + result.matchedCount);
}
