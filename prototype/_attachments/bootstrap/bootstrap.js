var bootstrap = function(thingStore) {
  var thing = thingStore.lookup('uri:thing');
  
  var type = thing.createRaw('uri:type');
  
  var literal = thing.createRaw('uri:literal');
  var string = thing.createRaw('uri:string');
  var code = thing.createRaw('uri:code');
  var boolean = thing.createRaw('uri:boolean');
  var number = thing.createRaw('uri:number');
  var date = thing.createRaw('uri:date');
  
  var property = thing.createRaw('uri:property');
  var collection = thing.createRaw('uri:collection');
  var relationship = thing.createRaw('uri:relationship');
  
  var label = thing.createRaw('uri:label');
  var ofType = thing.createRaw('uri:of-type');
  var subTypeOf = thing.createRaw('uri:subtype-of');
  var subPropertyOf = thing.createRaw('uri:subproperty-of');
  var hasProperties = thing.createRaw('uri:has-properties');
  var inverse = thing.createRaw('uri:inverse');
  var validate = thing.createRaw('uri:validate');
  var lastModified = thing.createRaw('uri:last-modified');
  var modifiedBy = thing.createRaw('uri:modified-by');
  
  var range = thing.createRaw('uri:range');
  var domain = thing.createRaw('uri:domain');
  
  var propertySelect = thing.createRaw('uri:property-select');
  var description = thing.createRaw('uri:description');
  
  var hiddenThing = thing.createRaw('uri:hidden-thing');
  var systemThing = thing.createRaw('uri:system-thing');
  
  type.extendRaw([
    [label.uri(), 'Type'],
    [ofType.uri(), [thing.uri(), type.uri()]],
    [hasProperties.uri(), [
      hasProperties.uri(),
      subTypeOf.uri()
    ]]
  ]);
  
  //the basic data types:
  literal.extendRaw([
    [label.uri(), 'Literal'],
    [ofType.uri(), [type.uri()]],
    [hasProperties.uri(), [
      validate.uri()
    ]]
  ]);

  string.extendRaw([
    [label.uri(), 'String'],
    [subTypeOf.uri(), [literal.uri()]],
    [ofType.uri(), [type.uri()]],
    [validate.uri(), function(value) {
      return (typeof value == 'string') | (value == null)
    }]
  ]);
  
  code.extendRaw([
    [label.uri(), 'Code'],
    [subTypeOf.uri(), [literal.uri()]],
    [ofType.uri(), [type.uri()]],
    [validate.uri(), function(value) {
      return (typeof value == 'function') | (value == null)
    }]
  ]);

  boolean.extendRaw([
    [label.uri(), 'Boolean'],
    [subTypeOf.uri(), [literal.uri()]],
    [ofType.uri(), [type.uri()]],
    [validate.uri(), function(value) {
      return (typeof value == 'boolean')
    }]
  ]);

  number.extendRaw([
    [label.uri(), 'Number'],
    [subTypeOf.uri(), [literal.uri()]],
    [ofType.uri(), [type.uri()]],
    [validate.uri(), function(value) {
      return (typeof value == 'number') | (value == null)
    }]
  ]);

  date.extendRaw([
    [label.uri(), 'Date'],
    [subTypeOf.uri(), [literal.uri()]],
    [ofType.uri(), [type.uri()]],
    [validate.uri(), function(value) {
      return true
    }]
  ]);

  hasProperties.extendRaw([
    [label.uri(), 'has properties'],
    [ofType.uri(), [collection.uri()]],
    [domain.uri(), thing.uri()],
    [range.uri(), property.uri()]
  ]);

  //the property prototype
  property.extendRaw([
    [label.uri(), 'Property'],
    [ofType.uri(), [type.uri()]],
    [hasProperties.uri(), [
      domain.uri(),
      range.uri()
    ]]
  ]);
  
  validate.extendRaw([
    [label.uri(), 'range'],
    [ofType.uri(), [property.uri()]],
    [domain.uri(), thing.uri()],
    [range.uri(), code.uri()]
  ]);
  
  propertySelect.extendRaw([
    [label.uri(), 'Select Property'],
    [ofType.uri(), [property.uri()]],
    [domain.uri(), thing.uri()],
    [range.uri(), property.uri()]
  ]);

  range.extendRaw([
    [label.uri(), 'range'],
    [ofType.uri(), [property.uri()]],
    [range.uri(), thing.uri()],
    [domain.uri(), property.uri()]
  ]);

  domain.extendRaw([
    [label.uri(), 'domain'],
    [ofType.uri(), [property.uri()]],
    [range.uri(), thing.uri()],
    [domain.uri(), property.uri()]
  ]);

  //a basic label property
  label.extendRaw([
    [range.uri(), string.uri()],
    [ofType.uri(), [property.uri()]],
    [domain.uri(), thing.uri()],
    [label.uri(), 'label']
  ]);

  //a description property
  description.extendRaw([
    [label.uri(), 'description'],
    [ofType.uri(), [property.uri()]],
    [domain.uri(), thing.uri()],
    [range.uri(), string.uri()]
  ]);

  collection.extendRaw([
    [label.uri(), 'collection'],
    [subTypeOf.uri(), [property.uri()]],
    [ofType.uri(), [type.uri()]]
  ]);

  inverse.extendRaw([
    [label.uri(), 'inverse'],
    [ofType.uri(), [collection.uri()]],
    [inverse.uri(), [
      inverse.uri()
    ]],
    [domain.uri(), property.uri()],
    [range.uri(), property.uri()]
  ]);

  relationship.extendRaw([
    [label.uri(), 'relationship'],
    [subTypeOf.uri(), [collection.uri()]],
    [ofType.uri(), [type.uri()]],
    [hasProperties.uri(), [
      inverse.uri()
    ]]
  ]);

  // relationship to set types
  ofType.extendRaw([
    [label.uri(), 'of Type'],
    [ofType.uri(), [collection.uri()]],
    [domain.uri(), thing.uri()],
    [range.uri(), type.uri()]
  ]);
  
  subTypeOf.extendRaw([
    [label.uri(), 'subtype of'],
    [ofType.uri(), [collection.uri()]],
    [domain.uri(), thing.uri()],
    [range.uri(), thing.uri()]
  ]);
  
  subPropertyOf.extendRaw([
    [label.uri(), 'subproperty of'],
    [ofType.uri(), [collection.uri()]],
    [domain.uri(), property.uri()],
    [range.uri(), property.uri()]
  ]);

  // types to define security and visibility
  hiddenThing.extendRaw([
    [label.uri(), 'hidden thing'],
    [ofType.uri(), [type.uri()]]
  ]);

  systemThing.extendRaw([
    [label.uri(), 'system thing'],
    [ofType.uri(), [type.uri()]]
  ]);
  
  lastModified.extendRaw([
    [label.uri(), 'last modified'],
    [ofType.uri(), [property.uri()]],
    [domain.uri(), thing.uri()],
    [range.uri(), date.uri()]
  ]);
  
  modifiedBy.extendRaw([
    [label.uri(), 'modified by'],
    [ofType.uri(), [property.uri()]],
    [domain.uri(), thing.uri()],
    [range.uri(), string.uri()]
  ]);
}