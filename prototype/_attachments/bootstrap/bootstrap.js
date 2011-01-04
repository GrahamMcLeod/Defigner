var bootstrap = function(thingStore) {
  var thing = thingStore.lookup('uri:thing');
  //the basic data types:
  var literal = thing.make([
    ['name', 'literal'],
  ]);
  
  var string = literal.make([
    ['name', 'string'],
    ['validateProperty', function(value) {return (typeof value == 'string') | (value == undefined)}]
  ]);
  
  var boolean = literal.make([
    ['name', 'boolean'],
    ['validateProperty', function(value) {return (typeof value == 'boolean')}]
  ]);
  
  var number = literal.make([
    ['name', 'number'],
    ['validateProperty', function(value) {return (typeof value == 'number') | (value == undefined)}]
  ]);
  
  var date = literal.make([
    ['name', 'date'],
    ['validateProperty', function(value) {return true}]
  ]);
  
  //the property prototype
  var property = thing.make([
    ['name', 'property'],
    ['domain', thing],
    ['range', thing],
    ['collection', false],
    ['postMake', function() {
      var inverse = this.property('inverse');
      if(inverse) {
        var domain = inverse.property('range');
        var range = inverse.property('domain');
        this.property('domain', domain);
        this.property('range', range);
        inverse.property('inverse', this);
      }
    }]
  ]);
  
  //a basic label property
  var label = property.make([
    ['name', 'label'],
    ['range', string],
    ['label', function() {return this.name}]
  ]);
  
  //a description property
  var description = property.make([
    ['name', 'description'],
    ['range', string]
  ]);
  
  var collection = property.make([
    ['name', 'collection'],
    ['collection', true],
    [label, 'a property with multiple values']
  ]);
  
  var relationship = collection.make([
    ['name', 'relationship'],
    [label, 'a relationship']
  ]);
  
  // relationship to set types
  var ofType = collection.make([
    ['name', 'of_type'],
    [label, 'of Type'],
  ]);
  
  // property value to be used to declare a thing as a type
  var type = thing.make([
    ['name', 'type'],
    [label, 'Type']
  ]);
  
  // types to define security and visibility
  var hiddenThing = thing.make([
    ['name', 'hidden_thing'],
    [label, 'hidden thing'],
    [ofType, [type]]
  ]);
  
  var systemThing = thing.make([
    ['name', 'system_thing'],
    [label, 'system thing'],
    [ofType, [type]]
  ]);
}