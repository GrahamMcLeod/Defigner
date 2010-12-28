var thingStore = {
  data: {},
  db: "/prototype",
  lookup: function(uri) {
    var thing = this.data[uri];
    if(thing) {
      if(thing.isAThing) {
        return thing;
      }
    }
  },
  types: function(startURI, levels) {
    
  },
  save: function(thing) {
    this.data[thing.uri] = thing;
    this.saveURIToCouch(thing.uri);
  },
  saveURIToCouch: function(uri, rev) {
    var thing = this.data[uri].serialize();
    var encodedURI = encodeURI(uri.replace(/\//g, '_'));
    var doc = {_id: encodedURI, thing: thing};
    if(rev) doc._rev = rev;
    $.ajax({
      type: 'POST',
      url: this.db,
      data: JSON.stringify(doc),
      contentType: 'application/json',
      success: function(data) {},
      error: function(data) {
        $.get(thingStore.db + '/' + encodedURI, function(data) {
          var oldDoc = JSON.parse(data);
          var rev = oldDoc._rev;
          thingStore.saveURIToCouch(uri, rev);
        });
      }
    });
    //this.db.saveDoc({_id: encodedURI, thing: thing});
  },
  flushToCouch: function() {
    var docs = [];
    for(var uri in this.data) {
      this.saveURIToCouch(uri);
    }
    this.db.saveDoc({prototype:this.data});  
  }
};

var thing = {
  name: 'Thing',
  uri: 'uri:thing',
  prototype: 'thing',
  namespace: 'default_context',
  isAThing: true,
  toString: function() {return this.uri},
  toPredicateString: function() {return this.name},
  toObjectString: function() {
    var value = this.property('value');
    if(value) {
      if(value.isAThing) {
        value = value.toPredicateString();
      }    
    }
    return value;
  },
  toSubjectString: function() {
    return this.toString();
  },
  properties: {},
  serialize: function() {
    var serializedThing = {};
    for(var prop in this) {
      if(this.hasOwnProperty(prop)) {
        serializedThing[prop] = this[prop];
      }
    }
    stringifyFunctions(serializedThing);
    return serializedThing;
  },
  propertyType: function(property, value) {
    if(value) {
      this.properties[property] = value;
    } else {
      var propertyType = thingStore.lookup(this.properties[property]);
      return propertyType;
    }
  },
  prototypeDeserialize: function(uri) {
    return thingStore.lookup(uri);
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
  view: function() {
    var properties = [];
    for(var prop in this) {
      var propertyType = thingStore.lookup(prop);
      if(propertyType) {
        var label = propertyType.toPredicateString();
        var value = this.property(propertyType.name);
        if(value) {
          if(value.isAThing) {
            value = value.toObjectString();
          }
        }
        var uri = prop;
        properties.push({label: label, value: value, uri: uri});
      }
    }
    return {name: this.name, uri: this.uri, properties: properties};
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

  make: function(nameOrArray) {
    var F = function() {};
    F.prototype = this;
    var newThing = new F();
    newThing.prototype = this.uri;
    if(typeof nameOrArray == 'string') {
      var name = nameOrArray;
      newThing.name = name;
      newThing.uri = this.uri + '/' + encodeURIComponent(name).toLowerCase();
      newThing.store();
    } else {
      nameOrArray.forEach(function(each) {
        if (each[0] == 'name') newThing.name = each[1];
        if (each[0] == 'uri') newThing.uri = each[1];        
      });
      if(!newThing.hasOwnProperty('uri')) {
          newThing.uri = this.uri + '/' + encodeURIComponent(newThing.name).toLowerCase();        
      }
      newThing.store();
      newThing.extend(nameOrArray);      
    }
    return newThing;
  },
  store: function() {
    thingStore.save(this);
  },
  extend: function(array) {
    var thing = this;
    array.forEach(function(each) {
      if(typeof each[1] == 'function') {
        thing.method(each[0], each[1]);
      } else {
        thing.property(each[0], each[1]);      
      }
    });
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
    if(!value && (!name.isAThing)) {
      var propertyName = this.propertyType(name);
      if(propertyName) {
        var value = this[propertyName];
      } else {
        var value = this[name];
      }
      //deserialize Value if function is given
      if(this[name + 'Deserialize']) {
        value = this[name + 'Deserialize'](value);
      } else {
        var resolvedThing = thingStore.lookup(value);
        if(resolvedThing) {
          value = resolvedThing;
        }
      }
      return value;
    } else {
      if(['name', 'uri', 'namespace', 'isAThing'].indexOf(name) > -1) {return};
      if(name.isAThing) {
        this.propertyType(name.name, name.uri);
        var propertyValue = name.make([
            ['name', name.name],
            ['uri', this.uri + '/p_' + name.name]
        ]);
        if((typeof value == 'object') && (!value.isAThing)) {
          propertyValue.extend(value);
        } else {
          propertyValue.property('value', value);
        }
        this[name] = propertyValue.uri;
      } else {
        var propertyType = this.propertyType(name);
        if(this[name + 'Serialize']) value = this[name + 'Serialize'](value);
        if(propertyType) {
          var propertyValue = propertyType.make([
            ['name', name],
            ['uri', this.uri + '/p_' + name]
          ]);
          if((typeof value == 'object') && (!value.isAThing)) {
            propertyValue.extend(value);
          } else {
            propertyValue.property('value', value);
          }
          this[this.propertyType(name)] = propertyValue.uri;        
        } else {
          this[name] = value;
        }

      }
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
    return thingStore.lookup(this.parentURI());
  },
  typeURI: function() {
    return this.prototype;
  },
  type: function() {
    return thingStore.lookup[this.typeURI()];
  },
  isKindOf: function(type) {
    return this.uri.indexOf(type) == 0;
  }
};
thing.store();
var property = thing.make([
  ['name', 'property'],
  ['value', undefined],
  ['valueSerialize', function(value) {return value}],
  ['valueDeserialize', function(value) {return value}],
  ['propHTML', function () {return this.property('value')}]
]);

var string = property.make([
  ['name', 'string']
]);

property.property(string.make('description'), 'a property');

var number = property.make([
  ['name', 'number'],
  ['description', 'a number']
]);

var date = property.make([
  ['name', 'date'],
  ['description', 'a date']
]);

var link = property.make([
  ['name', 'link'],
  ['description', 'a link to a composite thing'],
  ['propHTML', function () {var value = this.property('value'); if(value) return value.property('name')}],
  ['valueSerialize', function(value) {
    if(typeof value == 'string') {
      return value;
    } else {
      return value.uri;  
    }
  }],
  ['valueDeserialize', function(value) {
    return thingStore.lookup(value);
  }]
]);

var relationship = link.make([
  ['name', 'relationship'],
  ['description', 'a relationship prototype'],
  ['inverseRelationship', relationship],
  ['inverseRelationshipSerialize', function(value) {
    if(typeof value == 'string') {
      var inverseRel = relationship.make([
        ['name', value],
        ['value', this.property('value')],
        ['inverseRelationship', this]
      ]);
      return inverseRel.uri;
    } else {
      return value.uri;
    }
  }],
  ['valueSerialize', function(value) {
    if(!value) return value;
    if(this.hasOwnProperty('inverseRelationship')) {
      return value.uri;
    } else {
      var inverseRel = this.property('inverseRelationship');
      var source = this.parent();
      value.property(inverseRel, [['inverseRelationship', this]]);
      var inverseProp = value.property(inverseRel.name);
      inverseProp.value = source.uri;
      this.property('inverseRelationship', inverseProp);
      return value.uri;
    }
  }]
]);