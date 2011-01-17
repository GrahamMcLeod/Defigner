var bootstrap = function(thingStore) {
  var thing = thingStore.lookup(thing.uri());
  
  var type = thing.item('type');
  
  var literal = type.item('literal');
  var string = literal.subType('string');
  var code = literal.subType('code');
  var boolean = literal.subType('boolean');
  var number = literal.subType('number');
  var date = literal.subType('date');
  
  var property = type.item('property');
  var collection = property.subType('collection');
  var relationship = collection.subType('relationship');
  
  var label = property.item('label');
  var ofType = collection.item('of-type');
  var subTypeOf = collection.item('subtype-of');
  var subPropertyOf = collection.item('subproperty-of');
  var hasProperties = collection.item('has-properties');
  var inverse = collection.item('inverse');
  var validate = property.item('validate');
  
  
  var range = property.item('range');
  var domain = property.item('domain');
  
  var propertySelect = property.item('property-select');
  var description = property.item('description');
  
  var hiddenThing = type.item('hidden-thing');
  var systemThing = type.item('system-thing');
  
  type.extend([
    [label.uri(), 'Type'],
    [hasProperties.uri(), [
      hasProperties.uri()
    ]
  ], true);
  
  //the basic data types:
  literal.extend([
    [label.uri(), 'Literal'],
    [hasProperties.uri(), [
      validate.uri()
    ]]
  ], true);

  string.extend([
    [label.uri(), 'String'],
    [validate.uri(), function(value) {
      return (typeof value == 'string') | (value == null)
    }]
  ], true);
  
  code.extend([
    [label.uri(), 'Code'],
    [validate.uri(), function(value) {
      return (typeof value == 'function') | (value == null)
    }]
  ], true);

  boolean.extend([
    [label.uri(), 'Boolean'],
    [validate.uri(), function(value) {
      return (typeof value == 'boolean')
    }]
  ], true);

  number.extend([
    [label.uri(), 'Number'],
    [validate.uri(), function(value) {
      return (typeof value == 'number') | (value == null)
    }]
  ], true);

  date.extend([
    [label.uri(), 'Date'],
    [validate.uri(), function(value) {
      return true
    }]
  ], true);

  //the property prototype
  property.extend([
    [label.uri(), 'Property'],
    [hasProperties.uri(), [
      domain.uri(),
      range.uri()
    ]]
  ], true);
  
  validate.extend([
    [label.uri(), 'range'],
    [domain.uri(), thing.uri()],
    [range.uri(), 'uri:thing/literal/code']
  ], true);
  
  propertySelect.extend([
    [label.uri(), 'Select Property'],
    [range.uri(), property.uri()]
  ], true);

  range.extend([
    [label.uri(), 'range'],
    [range.uri(), thing.uri()],
    [domain.uri(), property.uri()]
  ], true);

  domain.extend([
    [label.uri(), 'domain'],
    [range.uri(), thing.uri()],
    [domain.uri(), property.uri()]
  ], true);

  //a basic label property
  label.extend([
    [range.uri(), string.uri()],
    [domain.uri(), thing.uri()],
    [label.uri(), 'label']
  ], true);

  //a description property
  description.extend([
    [range.uri(), string.uri()],
    [label.uri(), 'description']
  ], true);

  collection.extend([
    [label.uri(), 'collection']
  ], true);

  inverse.extend([
    [label.uri(), 'inverse'],
    [inverse.uri(), [
      inverse.uri()
    ]]
  ], true);

  relationship.extend([
    [label.uri(), 'relationship'],
    [hasProperties.uri(), [
      inverse.uri()
    ]
  ], true);

  // relationship to set types
  ofType.extend([
    [label.uri(), 'of Type'],
  ], true);
  
  subTypeOf.extend([
    [label.uri(), 'subtype of']
  ], true);
  
  subPropertyOf.extend([
    [label.uri(), 'subproperty of']
  ], true);

  // types to define security and visibility
  hiddenThing.extend([
    [label.uri(), 'hidden thing'],
    [ofType.uri(), [type.uri()]]
  ], true);

  systemThing.extend([
    [label.uri(), 'system thing'],
    [ofType.uri(), [type.uri()]]
  ], true);
}