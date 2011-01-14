
var createDictionary = function(thingStore) {
  var dictData = {
    'thing': 'uri:thing',
    'property': 'uri:thing/property',
    'literal': 'uri:thing/literal',
    'string': 'uri:thing/literal/string',
    'number': 'uri:thing/literal/number',
    'date': 'uri:thing/literal/date',
    'range': 'uri:thing/property/range',
    'domain': 'uri:thing/property/domain',
    'label': 'uri:thing/property/label',
    'description': 'uri:thing/property/description',
    'collection': 'uri:thing/property/collection',
    'relationship': 'uri:thing/property/collection/relationship',
    'inverse': 'uri:thing/property/collection/inverse'
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