var thingStore = {};

var thingStoreLookup = function(uri) {
  return thingStore[uri];
};

var thingStoreSave = function(thing) {
  thingStore[thing.uri] = thing;
}
var thingStoreToCouch = function () {
  var db = $.couch.db("prototype");
  db.saveDoc({prototype:thingStore});
}

var thing = {
  name: 'Thing',
  uri: 'uri:thing',
  prototype: 'thing',
  namespace: 'default_context',
  isAThing: true,
  prototypeDeserialize: function(uri) {
    return thingStoreLookup(uri);
  },
  show: function() {
    alert(this.json());
  },
  json: function() {
    var fullThing = {};
    for (var property in this) {
      fullThing[property] = this[property];
    }
    return JSON.stringify(fullThing);
  },
  myText:  function () {var tempText='';
                        for (var property in this) {tempText=tempText+property+': '+this[property]+'\n'};
                        return tempText},
  myHTML: function () {
    var tempHTML='';
    for (var property in this) {
      if (typeof this[property] != 'function') {
        tempHTML=tempHTML+'<DIV>' + property+ ': ';
        var tempProp = this.property(property);
        if (tempProp.isAThing) {
          tempHTML=tempHTML+tempProp.propHTML()
        } else {
          tempHTML=tempHTML+tempProp
        }
        tempHTML=tempHTML+'</DIV>'
      }
  	}
  	return tempHTML;
  },
  propHTML: function () {return this.property ('name')
  },

  make: function(nameOrObj) {
    var F = function() {};
    F.prototype = this;
    var newThing = new F();
    newThing.prototype = this.uri;
    if(typeof nameOrObj == 'string') {
      var name = nameOrObj;
      newThing.name = name;
      newThing.uri = this.uri + '/' + encodeURIComponent(name).toLowerCase();
    } else {
      var name = nameOrObj.name;
      if(nameOrObj.uri) {
        newThing.uri = nameOrObj.uri;      
      } else {
        if(name) {
          newThing.name = name;
          newThing.uri = this.uri + '/' + encodeURIComponent(name).toLowerCase();        
        }
      }
      //if no URI is supplied, return callback function which can be used to defer initialization of newThing
      if(!newThing.hasOwnProperty('uri')) {
        return {
          callback: function(uri) {
            newThing.uri = uri;
            newThing.extend(nameOrObj);
            newThing.store();
            return newThing
          }
        };
      }
      newThing.extend(nameOrObj);      
    }
    newThing.store();    
    return newThing;
  },
  store: function() {
    thingStore[this.uri] = this;
  },
  extend: function(obj) {
    for(var property in obj) {
      if(typeof obj[property] == 'function') {
        this.method(property, obj[property]);
      } else {
        this.property(property, obj[property]);      
      }
    }
  },
  remakeWithType: function(proto) {
    var newObj = proto.make(this.name);
    for(var property in this) {
      if(this.hasOwnProperty(property) && (property != 'uri')) {
        newObj[property] = this[property];
      }
    }
    newObj.store();
    return newObj;
  },
  property: function(name, value) {
    if(!value) {
      var value = this[name];
      //deserialize Value if function is given
      if(this[name + 'Deserialize']) {
        value = this[name + 'Deserialize'](value);
      } else {
        var resolvedThing = thingStoreLookup(value);
        if(resolvedThing) {
          value = resolvedThing;
        }
      }
      return value;
    } else {
      if(['name', 'uri', 'namespace', 'isAThing'].indexOf(name) > -1) {return};
      if(value.callback) {
        value = value.callback(this.uri + '/_' + name);
      }
      //Serialize Value if function is given
      if(this[name + 'Serialize']) {
        value = this[name + 'Serialize'](value);
      }
      if(value.isAThing) {
        value = value.uri;
      }
      var findPropertyType = function(thing) {
        if(thing.type() == thing.parent()) {
          return thing;
        } else {
          return findPropertyType(thing.type());
        }
      }
      var currentProperty = this.property(name);
      if(currentProperty) {
        if(currentProperty.isAThing) {
          var propertyType = findPropertyType(currentProperty);
          var property = propertyType.make({uri: this.uri + '/_' + name})
          if(typeof value == 'object') {
            property.extend(value);
          } else {
            property.property('value', value);
          }
          value = property.uri;
        }      
      }
      this[name] = value;
    }
  },
  method: function(name, value) {
    if(!value) return this[name];
    this[name] = value;
  },
  parentURI: function() {
    var uri = this.uri.split('/');
    uri.pop();
    return uri.join('/');
  },
  parent: function() {
    return thingStoreLookup(this.parentURI());
  },
  typeURI: function() {
    return this.prototype;
  },
  type: function() {
    return thingStore[this.typeURI()];
  },
  isKindOf: function(type) {
    return this.uri.indexOf(type) == 0;
  }
}
thing.store();
var property = thing.make({
  name: 'property',
  value: undefined,
  valueSerialize: function(value) {return value},
  valueDeserialize: function(value) {return value},
  propHTML: function () {return this.property('value')
  }

});

var string = property.make({
  name: 'string',
});

property.property('description', string.make({value: 'a property'}));

var number = property.make({
  name: 'number',
  description: 'a number'
});

var date = property.make({
  name: 'date',
  description: 'a date'
});

var link = property.make({
  name: 'link',
  description: 'a link to a composite thing',
  propHTML: function () {return this.property('value').property('name')},
  valueSerialize: function(value) {
    if(typeof value == 'string') {
      return value;
    } else {
      return value.uri;  
    }
  },
  valueDeserialize: function(value) {
    return thingStore[value];
  }
});

var relationship = link.make({
  name: 'relationship',
  description: 'a relationship prototype',
  inverseRelationship: relationship,
  inverseRelationshipSerialize: function(value) {
    if(typeof value == 'string') {
      var target = this.property('value');
      var source = this.parentURI();
      target.property(value, relationship.make({
        value: source,
        inverseRelationship: this
      }));
      return target.property(value);
    } else {
      return value;
    }
  },
  inverseRelationshipDeserialize: function(value) {
  
  }
});