import neo from './.neo.json';
import old from './.old.json';

const GRAPH_OBJECT_KEY_PROPERTY = /^[er]\._key/;
const ENTITY_PROPERTY = /^e\./;
const RELATIONSHIP_PROPERTY = /^r\./;

const extractor = (acc, obj) => {
  const entity: any = {};
  const relationship: any = {};
  for (const key in obj) {
    if (ENTITY_PROPERTY.test(key)) {
      entity[key.slice(2)] = obj[key];
      if (GRAPH_OBJECT_KEY_PROPERTY.test(key)) {
        acc[obj[key]] = entity;
      }
    } else if (RELATIONSHIP_PROPERTY.test(key)) {
      relationship[key.slice(2)] = obj[key];
      if (GRAPH_OBJECT_KEY_PROPERTY.test(key)) {
        acc[obj[key]] = relationship;
      }
    }
  }
  return acc;
};

const oldByKey = old.data.reduce(extractor, {});
const newByKey = neo.data.reduce(extractor, {});

const oldKeys: string[] = [];
const newKeys: string[] = [];

const pairs: { [key: string]: { key: string; old: any; neo: any } } = {};
for (const [key, value] of Object.entries(oldByKey)) {
  oldKeys.push(key);
  pairs[key] = { key, old: value, neo: newByKey[key] };
}
for (const [key, value] of Object.entries(newByKey)) {
  newKeys.push(key);
  if (!pairs[key]) {
    pairs[key] = { key, old: oldByKey[key], neo: value };
  }
}

console.log({
  oldKeys: oldKeys.length,
  newKeys: newKeys.length,
});

const differences: any[] = [];
for (const [key, { old, neo }] of Object.entries(pairs)) {
  if (!old || !neo) {
    const mappedRelationship =
      'system-mapper' === (old?._source || neo?._source);
    differences.push({ key, mappedRelationship, old, neo });
  }
}

console.log(JSON.stringify(differences, null, 2));
