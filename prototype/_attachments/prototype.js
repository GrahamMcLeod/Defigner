var thingStore = {
  localData: {},
  persistedData: {},
  db: "/prototype",
  lookup: function(uri) {
    var thing = this.localData[uri];
    if(!thing) {
      thing = this.persistedData[uri];
      if(!thing) {
        throw new Error('URI not found');
      }
    }
    return thing;
  },
  types: function(startURI, levels) {
    
  },
  save: function(thing) {
    this.localData[thing.uri] = thing;
  },
  saveThingToCouch: function(thing, cb, rev) {
    var that = this;
    var thingSerialized = thing.serialize();
    var encodedURI = encodeURI(thing.uri.replace(/\//g, '_'));
    var doc = {_id: encodedURI, thing: thingSerialized};
    if(rev) doc._rev = rev;
    $.ajax({
      type: 'POST',
      url: this.db,
      data: JSON.stringify(doc),
      contentType: 'application/json',
      success: function(data) {cb()},
      error: function(data) {
        $.get(that.db + '/' + encodedURI, function(data) {
          var oldDoc = JSON.parse(data);
          var rev = oldDoc._rev;
          that.saveThingToCouch(thing, cb, rev);
        });
      }
    });
    //this.db.saveDoc({_id: encodedURI, thing: thing});
  },
  load: function(uri) {
    $.get(that.db + '/' + encodedURI, function(data) {
      var oldDoc = JSON.parse(data);
      var rev = oldDoc._rev;
      that.saveThingToCouch(thing, cb, rev);
    });
  },
  revert: function() {
    this.localData = {};
  },
  commit: function() {
    var that = this;
    var things = [];
    for(var uri in this.localData) {
      things.push(this.localData[uri]);
      this.persistedData[uri] = this.localData[uri];
      delete this.localData[uri];
    }
    arrayForEachLinear(things, function(each, cb) {
      that.saveThingToCouch(each, cb)
    }, function() {
    
    });
  },
  encodeURI: function(uri) {
  
  }
};

var thing = {
  name: 'thing',
  uri: 'uri:thing',
  prototype: 'thing',
  namespace: 'default_context',
  isAThing: true,
  toString: function() {return this.uri},
  serialize: function() {
    var serializedThing = {functions: []};
    for(var prop in this) {
      if(this.hasOwnProperty(prop)) {
        serializedThing[prop] = this[prop];
        if(typeof this[prop] == 'function') serializedThing.functions.push(prop);
      }
    }
    stringifyFunctions(serializedThing);
    return serializedThing;
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
        var label = propertyType.toString();
        var value = this.property(propertyType);
        if(value) {
          if(value.isAThing) {
            value = value.toString();
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
    newThing = this.parse(nameOrArray);
    newThing.store();
    return newThing;
  },
  parse: function(nameOrArray) {
    var F = function() {};
    F.prototype = this;
    var newThing = new F();
    newThing.prototype = this.uri;
    if(typeof nameOrArray == 'string') {
      var name = nameOrArray;
      newThing.name = name;
      newThing.uri = this.uri + '/' + encodeURIComponent(name).toLowerCase();
    } else {
      nameOrArray.forEach(function(each) {
        if (each[0] == 'name') newThing.name = each[1];
        if (each[0] == 'uri') newThing.uri = each[1];        
      });
      if(!newThing.hasOwnProperty('uri')) {
          newThing.uri = this.uri + '/' + encodeURIComponent(newThing.name).toLowerCase();        
      }
      newThing.extend(nameOrArray);      
    }
    if(newThing.postMake) newThing.postMake();
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
    if(!value) {
      var value = this[name];
      if((['range', 'domain', 'prototype', 'inverse'].indexOf(name) > -1) && value) value = thingStore.lookup(value);
      if(name.isAThing) {
        if(! name.property('range').ofType('uri:thing/literal')) {
          value = thingStore.lookup(value);
        }
      }
      return value;
    } else {
      if(['name', 'uri', 'namespace', 'isAThing'].indexOf(name) > -1) {return};
      if(name.isAThing) {
        var domain = name.property('domain');
        var range = name.property('range');
        if(this.ofType(domain)) {
          if(range.ofType('uri:thing/literal')) {
            if(range.validateProperty(value)) {
              this[name] = value;
            } else {
              throw new Error('value must be of type ' + range.name);
            }
          } else {
            if(value.ofType(range)) {
              this[name] = value.uri;
              var inverse = name.property('inverse');
              if(inverse) {
                if(!value.hasOwnProperty(inverse.uri)) value.property(inverse, this);
              }
            } else {
              throw new Error('value must be of type ' + range.name);
            }
          }
        } else {
          throw new Error('domain must be of type ' + domain.name);
        }
      } else {
        if(value.isAThing) {
          this[name] = value.uri;
        } else {
          this[name] = value;        
        }
      }
    }
  },
  properties: function() {
    var props = [];
    for(var prop in this) {
      if(prop.indexOf('uri:') > -1) {
        props.push(thingStore.lookup(prop));
      }
    }
    return props;
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
  ofType: function(type) {
    if(type.isAThing) type = type.uri;
    return this.uri.indexOf(type) == 0;
  }
};
thing.store();


//the basic data types:
var literal = thing.make([
  ['name', 'literal'],
]);

var string = literal.make([
  ['name', 'string'],
  ['validateProperty', function(value) {return (typeof value == 'string') | (value == undefined)}]
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
  ['range', string]
]);

//a description property
var description = property.make([
  ['name', 'description'],
  ['range', string]
]);

var relationship = property.make([
  ['name', 'relationship'],
  [label, 'a relationship']
]);

thingStore.commit();