var thing = {
  name: 'thing',
  uri: 'uri:thing',
  prototype: 'thing',
  namespace: 'default_context',
  isAThing: true,
  toString: function() {return this.uri},
  label: function() {
    var labelProp = thingStore.lookup('uri:thing/property/label');
    return this.property(labelProp);
  },
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
    var that = this;
    this.properties().forEach(function(prop) {
      properties.push({label: prop.label(), value: that.propertyLabel(prop), uri: prop.uri});
    });
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
  propHTML: function () {
    return this.property ('name')
  },
  make: function(nameOrArray, createFromDB) {
    var newThing = this.parse(nameOrArray, createFromDB);
    if(!createFromDB) {
      newThing.property ("isPrototype", false);
      newThing.store();
      this.property ("isPrototype", true);
      this.store();
    }
    return newThing;
  },
  parse: function(nameOrArray, createFromDB) {
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
    if(newThing.postMake && (!createFromDB)) newThing.postMake();
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
  propertyLabel: function(prop) {
    var that = this;
    var value = that.property(prop)
    if(prop.ofType('uri:thing/property/collection')) {
      if(!prop.property('range').ofType('uri:thing/literal')) {
        var value = value.map(function(each) {
          return {label: each.label(), uri: each.uri}
        });
      }
    } else {
      if(!prop.property('range').ofType('uri:thing/literal')) {
        value = {label: value.label(), uri: value.uri}
      }
    }
    return value;
  },
  propertyAppend: function(name, value) {
    var currentProperty = this.property(name, value);
    currentProperty.push(value);
    this.property(name, value);
  },
  property: function(name, value) {
    var that = this;
    if(value == undefined) {
      var value = this[name];
      if(!value) return value;
      if((['range', 'domain', 'prototype', 'inverse'].indexOf(name) > -1) && value) value = thingStore.lookup(value);
      if(name.isAThing) {
        var isCollection = name.property('collection');
        if(! name.property('range').ofType('uri:thing/literal')) {
          if(isCollection) {
            value = value.map(function(each) {return thingStore.lookup(each)});
          } else {
            value = thingStore.lookup(value);          
          }
        }
      }
      return value;
    } else {
      if(['name', 'uri', 'namespace', 'isAThing'].indexOf(name) > -1) {return};
      if(name.isAThing) {
        var domain = name.property('domain');
        var range = name.property('range');
        var isCollection = name.property('collection');
        var validRange = true;
        if(this.ofType(domain)) {
          if(range.ofType('uri:thing/literal')) {
            if(isCollection) {
              value.forEach(function(each) {
                if(!range.validateProperty(each)) validRange = false;
              })
            } else {
              if(!range.validateProperty(value)) validRange = false;
            }
            if(validRange) {
              this[name] = value;
            }
          } else {
            if(isCollection) {
              value.forEach(function(each) {
                if(!each.ofType(range)) validRange = false;
              });
            } else {
              if(!value.ofType(range)) validRange = false;
            }
            if(validRange) {
              var inverse = name.property('inverse');
              if(isCollection) {            
                var serializedValue = value.map(function(each) {return each.uri});
              } else {
                var serializedValue = value.uri;
              }
              this[name] = serializedValue;
              
              //check if there is inverse property defined and create if necessary
              if(inverse) {
                if(isCollection) {
                  value.forEach(function(each) {
                    var inversePropertyValue = each[inverse];
                    if(!inversePropertyValue) inversePropertyValue = [];
                    if(inversePropertyValue.indexOf(that.uri) == -1) {
                      inversePropertyValue.push(that.uri);
                      each[inverse] = inversePropertyValue;
                      each.store();
                    }
                  })
                } else {
                  if(!(value[inverse] == this.uri)) {
                    value[inverse] = this.uri;
                    value.store();
                  }
                }               
              }     
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
// Define the thingStore which holds the collection of things created and provides methods to manipulate objects
var thingStore = {
  localData: {},
  persistedData: {'uri:thing': thing},
  db: "/prototype",
  userInfo: function(userInfo) {
    this.userInfoCached = userInfo;
  },
  prototypes: function (parent) {
    if (parent == undefined) {
      parent = thing;
    }     
    
    var encodedURI = encodeURI(parent.uri.replace(/\//g, '_'));
    $.ajax({
      type: 'GET',
      async: true,
      url: this.db + '/_design/prototype/_view/prototypes?key=' + JSON.stringify(encodedURI),
      success: function(data) { 
        var prototypeList = [];
        data.rows.forEach (function (each) { 
          prototypeList.push (this.parseJSON (each.doc))          
        });
      }
    });
    
  }
  lookup: function(uri, cb) {
    var thing = this.localData[uri];
    if(!thing) {
      thing = this.persistedData[uri];
      if(!thing) {
        var thing = this.load(uri);
        if(!thing) {
          throw new Error('URI not found');
        }
      }
    }
    return thing;
  },
  save: function(thing) {
    this.localData[thing.uri] = thing;
  },
  saveThingToCouch: function(thing, cb, rev) {
    var that = this;
    this.userInfoCached.postMake(thing);
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
  load: function(uri, cb) {
    var encodedURI = encodeURI(uri.replace(/\//g, '_'));
    var doc = $.ajax({
      type: 'GET',
      async: false,
      url: this.db + '/' + encodedURI,
      success: function(data) {
      }
    }).responseText;
    return this.parseJSON (doc);
  },
  // Create thing from JSON version ex database
  parseJSON: function(jsonDoc){
   var doc = JSON.parse(jsonDoc);
    var thingData = [];
    var functions = doc.thing.functions;
    delete doc.thing.functions;
    for(var prop in doc.thing) {
      var value = doc.thing[prop];
      if(functions.indexOf(prop) > -1) eval('value = ' + value);
      thingData.push([prop, value]);
    }
    var prototype = this.lookup(doc.thing.prototype);
    var thing = prototype.make(thingData, true);
    this.persistedData[thing.uri] = thing;
    return thing;
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