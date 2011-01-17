var createThingStore = function(db, userInfo, bootstrap) {
  var thing = {
    _uri: 'uri:thing',
    isAThing: true,
    isAType: function() {
      return this.ofType(type);
    },
    toString: function() {
      return this.uri()
    },
    uri: function(uri) {
      if(uri) {
        this._uri = uri;
      } else {
        if(this.hasOwnProperty('_uri')) {
          return this._uri;
        } else {
          return undefined;
        }
      }
    },
    label: function() {
      return this.property(labelProp);
    },
    serialize: function() {
      var serializedThing = {functions: []};
      for(var prop in this) {
        if(this.hasOwnProperty(prop)) {
          serializedThing[prop] = this[prop];
          if(typeof this[prop] == 'function')
            serializedThing.functions.push(prop);
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
      this.properties().forEach( function(prop) {
        properties.push({
          label: prop.label(),
          value: that.propertyLabel(prop),
          isLiteral: prop.property(range).ofType(literal),
          isCollection: prop.ofType(collection),
          uri: prop.uri()
        });
      });
      return {label: this.label(), uri: this.uri(), properties: properties};
    },
    item: function(URI, properties, noChecks) {
      var newThing = this.create(URI, properties, noChecks);
      newThing.propertyAppend(ofType, this);
      if(!noChecks) {
        newThing.store();
      }
      return newThing;
    },
    subType: function(URI, properties, noChecks) {
      var newThing = this.create(URI, properties, noChecks);
      newThing.propertyAppend(subTypeOf, this);
      if(!noChecks) {
        newThing.store();
      }
      return newThing;
    },
    create: function(URI, properties, noChecks) {
      var F = function() {
      };
      F.prototype = thing;
      var newThing = new F();
      if(URI) {
        if(URI.indexOf('uri:') > -1) {
          newThing.uri(URI);
        } else {
          newThing.uri(this.uri() + '/' + URI.replace(/ /g, '').toLowerCase());
        }
      }
      if(properties) {
        newThing.extend(nameOrArray, noChecks);
      }
      return newThing;
    },
    store: function() {
      thingStore.save(this);
    },
    extend: function(array, noChecks) {
      var that = this;
      array.forEach( function(each) {
        if(typeof each[1] == 'function') {
          thing.method(each[0], each[1]);
        } else {
          if(noChecks) {
            that.propertyRaw(each[0], each[1]);
          } else {
            that.property(each[0], each[1], noChecks);
          }
        }
      });
      thingStore.save(this);
    },
    propertyLabel: function(prop) {
      var that = this;
      var value = that.property(prop);
      if(prop.isAThing) {
        if(prop.ofType(collection)) {
          if(!prop.property(range).ofType(literal)) {
            value = value.map( function(each) {
              var label = each.label();
              return {label: label, uri: each.uri()}
            });
          }
        } else {
          if(!prop.property(range).ofType(literal) && (value != null) && (value != "")) {
            var label = value.label();
            value = {label: label, uri: value.uri()}
          }
        }
      }
      return {value: value, inherited: inherited};
    },
    propertyAppend: function(name, value, checkExistence) {
      var currentProperty = this.property(name);
      if(checkExistence) {
        if(currentProperty.indexOf(value) == -1) {
          currentProperty.push(value);
        }
      } else {
        currentProperty.push(value);
      }
      this.property(name, currentProperty);
    },
    propertyRaw: function(name, value) {
      if(value === undefined) {
        return this[name];
      } else {
        this[name] = value;
      }
    },
    property: function(name, value, noChecks) {
      var that = this;
      if(value === undefined) {
        var value = this[name];
        if(!value)
          return value;
        if(([range].indexOf(name) > -1) && (value != undefined))
          return thingStore.lookup(value);
        if(name.isAThing) {
          if(! name.property(range).ofType(literal)) {
            if(name.ofType(collection)) {
              value = value.map( function(each) {
                return thingStore.lookup(each)
              });
            } else {
              value = thingStore.lookup(value);
            }
          }
        }
        return value;
      } else {
        var propDomain = name.property(domain);
        var propRange = name.property(range);
        var isCollection = name.ofType(collection);
        var validateValue = function() {
          var validateLiteralValue = function() {
            if(isCollection) {
              value.forEach( function(each) {
                if(!propRange.[validate](each))
                  return false;
              })
            } else {
              if(!propRange.[validate](value)) {
                return false;
              }
            }
            return true;
          }
          var validateThingValue = function() {
            if(isCollection) {
              value.forEach( function(each) {
                if(!each.ofType(propRange))
                  return false;
              });
            } else {
              if(!value.ofType(propRange))
                return false;
            }
            return true;
          }
          //validateValue logic
          if(propRange.ofType(literal)) {
            return validateLiteralValue();
          } else {
            return validateThingValue();
          }
        }
        var setValue = function() {
          var setLiteralValue = function() {
            this[name] = value;
          };
          var setThingValue = function() {
            var checkInverse = function() {
              //check if there is inverse property defined and create if necessary
              var inversePropCol = name.property(inverse);
              if(inversePropCol) {
                inversePropCol.forEach( function(inverseProp) {
                  if(isCollection) {
                    value.forEach( function(each) {
                      var inversePropertyValue = each[inverseProp];
                      if(!inversePropertyValue)
                        inversePropertyValue = [];
                      if(inversePropertyValue.indexOf(that.uri()) == -1) {
                        if(each.hasOwnProperty(inverseProp)) {
                          inversePropertyValue.push(that.uri());
                        } else {
                          inversePropertyValue = [that.uri()];
                        }
                        each[inverseProp] = inversePropertyValue;
                        each.store();
                      }
                    })
                  } else {
                    if(!(value[inverseProp] == that.uri())) {
                      value[inverseProp] = that.uri();
                      value.store();
                    }
                  }
                });
              }
            };
            //setThingValue logic
            if(isCollection) {
              var serializedValue = value.map( function(each) {
                return each.uri()
              });
            } else {
              var serializedValue = value.uri();
            }
            this[name] = serializedValue;
            checkInverses();
          };
          //setValue logic
          if(propRange.ofType(literal)) {
            return setLiteralValue();
          } else {
            return setThingValue();
          }
        };
        //property logic
        if(this.ofType(propDomain)) {
          if(value == null) {
            if(isCollection) {
              this[name] = [];
            } else {
              this[name] = null;
            }
          } else {
            if(validateValue()) {
              setValue(value);
            } else {
              throw new Error(value + ' is not valid with a Range of ' + propRange.label() + ' on ' + name.label());
            }
          }
        } else {
          throw new Error(name.label() + ' has ' + propDomain.label() + ' as the domain. ' + that.label() + ' is therefore not valid.');
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
      if(!value)
        return this[name];
      this[name] = value;
    },
    types: function() {
      var myTypes = this.property(ofType);
      if(myTypes) {
        var inheritedTypes = [];
        myTypes.forEach( function(each) {
          inheritedTypes.concat(each.types());
        });
        return myTypes.concat(inheritedTypes);
      } else {
        return [];
      }
    },
    ofType: function(type) {
      if(type.isAThing) {
        type = type.uri();
      }
      return myTypes.indexOf(type) > -1
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
    prototypes: function (parent, cb) {
      var that = this;
      $.ajax({
        type: 'GET',
        async: true,
        url: this.db + '/_design/prototype/_view/prototypes?include_docs=true&key=' + JSON.stringify(parent.uri()),
        success: function(jsonData) {
          var data = JSON.parse(jsonData);
          var prototypeList = data.rows.map( function (each) {
            var localThing = that.lookupLocal(each.doc.thing._uri);
            if(localThing) {
              return localThing;
            } else {
              return that.parseData(each.doc);
            }
          });
          cb(prototypeList);
        }
      });
    },
    instances: function (parent, cb) {
      var that = this;
      $.ajax({
        type: 'GET',
        async: true,
        url: this.db + '/_design/prototype/_view/instances?include_docs=true&startkey='
        + JSON.stringify(parent.uri() + '/') + '&endkey="' + parent.uri() +'0"',
        success: function(jsonData) {
          var data = JSON.parse(jsonData);
          var prototypeList = data.rows.map( function (each) {
            var localThing = that.lookupLocal(each.doc.thing._uri);
            if(localThing) {
              return localThing;
            } else {
              return that.parseData(each.doc);
            }
          });
          cb(prototypeList);
        }
      });
    },
    lookupLocal: function(uri) {
      return this.localData[uri];
    },
    lookup: function(uri, cb) {
      var thing = this.lookupLocal(uri);
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
      this.localData[thing.uri()] = thing;
    },
    saveThingToCouch: function(thing, cb, rev) {
      var that = this;
      this.userInfoCached.postMake(thing);
      var thingSerialized = thing.serialize();
      var encodedURI = encodeURI(thing.uri().replace(/\//g, '_'));
      var doc = {_id: encodedURI, thing: thingSerialized};
      if(rev)
        doc._rev = rev;
      $.ajax({
        type: 'POST',
        url: this.db,
        data: JSON.stringify(doc),
        contentType: 'application/json',
        success: function(data) {
          cb()
        },
        error: function(data) {
          $.get(that.db + '/' + encodedURI, function(data) {
            var oldDoc = JSON.parse(data);
            var rev = oldDoc._rev;
            that.saveThingToCouch(thing, cb, rev);
          });
        }
      });
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
      return this.parseData(JSON.parse(doc));
    },
    // Create thing from JSON data ex database
    parseData: function(doc) {
      var thingData = [];
      var functions = doc.thing.functions;
      delete doc.thing.functions;
      for(var prop in doc.thing) {
        var value = doc.thing[prop];
        if(functions.indexOf(prop) > -1)
          eval('value = ' + value);
        thingData.push([prop, value]);
      }
      var prototype = this.lookup(doc.thing._prototype);
      var thing = prototype.make(thingData, true);
      this.persistedData[thing.uri()] = thing;
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
        try {
          that.saveThingToCouch(each, cb)
        } catch(e) {
          alert(e);
        }

      }, function() {

      });
    }
  };
  if(!bootstrap) {
    var label = dict('label');
    var range = dict('range');
    var domain = dict('domain');
    var inverse = dict('inverse');
    var ofType = dict('ofType');
    var subTypeOf = dict('subTypeOf');
    var collection = dict('collection');
    var literal = dict('literal');
    var type = dict('type');
    var validate = dict('validate');
    thing.property(label, 'Thing');
  }
  thingStore.userInfo(userInfo);
  return thingStore;
}