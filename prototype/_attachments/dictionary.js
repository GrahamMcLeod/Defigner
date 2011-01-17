
var createDictionary = function(thingStore) {
  var dictData = {
    'thing': 'uri:thing',
    'property': 'uri:thing/type/property',
    'literal': 'uri:thing/type/literal',
    'string': 'uri:thing/type/literal/string',
    'number': 'uri:thing/type/literal/number',
    'date': 'uri:thing/type/literal/date',
    'range': 'uri:thing/type/property/range',
    'domain': 'uri:thing/type/property/domain',
    'label': 'uri:thing/type/property/label',
    'description': 'uri:thing/type/property/description',
    'collection': 'uri:thing/type/property/collection',
    'relationship': 'uri:thing/type/property/collection/relationship',
    'inverse': 'uri:thing/type/property/collection/inverse',
    'select-property': 'uri:thing/type/property/select-property',
    'hasProperties': 'uri:thing/type/property/collection/has-properties'
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