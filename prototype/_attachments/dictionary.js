
var createDictionary = function(thingStore) {
  var dictData = {
    'thing': 'uri:thing',
    'type': 'uri:type',
    'property': 'uri:property',
    'literal': 'uri:literal',
    'string': 'uri:string',
    'number': 'uri:number',
    'date': 'uri:date',
    'range': 'uri:range',
    'domain': 'uri:domain',
    'label': 'uri:label',
    'description': 'uri:description',
    'collection': 'uri:collection',
    'relationship': 'uri:relationship',
    'inverse': 'uri:inverse',
    'select-property': 'uri:select-property',
    'hasProperties': 'uri:has-properties',
    'ofType': 'uri:of-type',
    'subTypeOf': 'uri:subtype-of',
    'subPropertyOf': 'uri:subproperty-of',
    'validate': 'uri:validate',
    'lastModified': 'uri:last-modified',
    'modifiedBy': 'uri:modified-by',
    'systemThing': 'uri:system-thing'
  }
  var dict = function(name, value) {
    if(value) {
      if(value.isAThing) value = value.uri();
      dictData[name] = value;
    } else {
      return thingStore.lookup(dictData[name]);
    } 
  }
  return dict;
}