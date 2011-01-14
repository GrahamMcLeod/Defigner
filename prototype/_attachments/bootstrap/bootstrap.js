var bootstrap = function(thingStore) {
  var thing = thingStore.lookup('uri:thing');
  //the basic data types:
  var literal = thing.make([
    ['name', 'literal'],
    ['uri:thing/property/label', 'Literal']
  ], true);
  
  var string = literal.make([
    ['name', 'string'],
    ['uri:thing/property/label', 'String'],
    ['validateProperty', function(value) {return (typeof value == 'string') | (value == undefined)}]
  ], true);
  
  var boolean = literal.make([
    ['name', 'boolean'],
    ['uri:thing/property/label', 'Boolean'],
    ['validateProperty', function(value) {return (typeof value == 'boolean')}]
  ], true);
  
  var number = literal.make([
    ['name', 'number'],
    ['uri:thing/property/label', 'Number'],
    ['validateProperty', function(value) {return (typeof value == 'number') | (value == undefined)}]
  ], true);
  
  var date = literal.make([
    ['name', 'date'],
    ['uri:thing/property/label', 'Date'],
    ['validateProperty', function(value) {return true}]
  ], true);
      
  //the property prototype
  var property = thing.make([
    ['name', 'property'],
    ['uri:thing/property/label', 'Property'],
    ['uri:thing/property/domain', 'uri:thing'],
    ['uri:thing/property/range', 'uri:thing'],
    ['collection', false],
    ['postMake', function() {
      var inverse = this.property('inverse');
      if(inverse) {
        var domain = inverse.property(range);
        var range = inverse.property(domain);
        this.property(domain, domain);
        this.property(range, range);
        inverse.property('inverse', this);
      }
    }]
  ], true);
  
  var range = property.make([
    ['name', 'range'],
    ['uri:thing/property/label', 'Range'],
    ['validateProperty', function(value) {return value.hasOwnProperty('uri')}],
    ['uri:thing/property/range', 'uri:thing'],
    ['uri:thing/property/domain', 'uri:thing/property']
  ], true);
  
  var domain = property.make([
    ['name', 'domain'],
    ['uri:thing/property/label', 'Domain'],
    ['validateProperty', function(value) {return value.hasOwnProperty('uri')}],
    ['uri:thing/property/range', 'uri:thing'],
    ['uri:thing/property/domain', 'uri:thing/property']
  ], true);
  
  //a basic label property
  var label = property.make([
    ['name', 'label'],
    [range.uri, string.uri],
    [domain.uri, thing.uri],
    ['uri:thing/property/label', 'Label']
  ], true);
  
  //a description property
  var description = property.make([
    ['name', 'description'],
    [range.uri, string.uri]
  ], true);
  
  var collection = property.make([
    ['name', 'collection'],
    ['collection', true],
    [label.uri, 'a property with multiple values']
  ], true);
  
  var relationship = collection.make([
    ['name', 'relationship'],
    [label.uri, 'a relationship']
  ], true);
  
  // relationship to set types
  var ofType = collection.make([
    ['name', 'of_type'],
    [label.uri, 'of Type'],
  ], true);
  
  // property value to be used to declare a thing as a type
  var type = thing.make([
    ['name', 'type'],
    [label.uri, 'Type']
  ], true);
  
  // types to define security and visibility
  var hiddenThing = thing.make([
    ['name', 'hidden_thing'],
    [label.uri, 'hidden thing'],
    [ofType.uri, [type.uri]]
  ], true);
  
  var systemThing = thing.make([
    ['name', 'system_thing'],
    [label.uri, 'system thing'],
    [ofType.uri, [type.uri]]
  ], true);
}