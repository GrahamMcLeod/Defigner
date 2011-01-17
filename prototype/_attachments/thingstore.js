var createThingStore = function(db, userInfo, bootstrap) {
  var thing = {
    _uri: 'uri:thing',
    'uri:label': 'Thing',
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
      return this.property(label);
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
      delete serializedThing._uri;
      return {uri: this.uri(), properties: serializedThing};
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
          isLiteral: prop.property(range).hasSupertype(literal),
          isCollection: prop.ofType(collection),
          uri: prop.uri()
        });
      });
      return {label: this.label(), uri: this.uri(), properties: properties};
    },
    item: function(URI, properties) {
      var newThing = this.create(URI, properties);
      newThing['uri:of-type'] = [this.uri()];
      if(properties) {
        newThing.extend(properties);
      }
      newThing.store();
      return newThing;
    },
    subType: function(URI, properties) {
      var newThing = this.create(URI, properties);
      newThing['uri:subtype-of'] = [this.uri()];
      newThing['uri:of-type'] = ['uri:type'];
      if(properties) {
        newThing.extend(properties);
      }
      newThing.store();
      return newThing;
    },
    create: function(URI) {
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
      return newThing;
    },
    createRaw: function(URI, properties, dontStore) {
      var F = function() {
      };
      F.prototype = thing;
      var newThing = new F();
      newThing.uri(URI);
      if(properties) {
        newThing.extendRaw(properties);
      }
      if(!dontStore) {
        newThing.store();
      }
      return newThing;
    },
    extendRaw: function(properties) {
      var that = this;
      properties.forEach( function(each) {
        that[each[0]] = each[1];
      });
    },
    store: function() {
      thingStore.save(this);
    },
    extend: function(array) {
      var that = this;
      array.forEach( function(each) {
        if(typeof each[1] == 'function') {
          that.method(each[0], each[1]);
        } else {
          that.property(each[0], each[1]);
        }
      });
      thingStore.save(this);
    },
    propertyLabel: function(prop) {
      var that = this;
      var value = that.property(prop);
      if(prop.isAThing) {
        if(prop.ofType(collection)) {
          if(!prop.property(range).hasSupertype(literal)) {
            value = value.map( function(each) {
              var label = each.label();
              return {label: label, uri: each.uri()}
            });
          }
        } else {
          if(!prop.property(range).hasSupertype(literal) && (value != null) && (value != "")) {
            var label = value.label();
            value = {label: label, uri: value.uri()}
          }
        }
      }
      return value;
    },
    propertyAppend: function(name, value, checkExistence) {
      var currentProperty = this.property(name);
      if(!currentProperty) {
        currentProperty = [];
      }
      value = value.map( function(each) {
        if(each.isAThing) {
          return each.uri()
        } else {
          return each;
        }
      });
      if(checkExistence) {
        if(currentProperty.indexOf(value) == -1) {
          currentProperty = currentProperty.concat(value);
        }
      } else {
        currentProperty = currentProperty.concat(value);
      }
      this.property(name, currentProperty);
    },
    property: function(name, value) {
      var that = this;
      if(value === undefined) {
        var value = this[name];
        if(!value)
          return value;
        if(name == range)
          return thingStore.lookup(value);
        if([ofType, subTypeOf].indexOf(name) > -1)
          return value.map( function(each) {
            return thingStore.lookup(each)
          });
        if(name.isAThing) {
          if(! name.property(range).hasSupertype(literal)) {
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
                if(!propRange[validate](each))
                  return false;
              })
            } else {
              if(!propRange[validate](value)) {
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
          if(propRange.hasSupertype(literal)) {
            return validateLiteralValue();
          } else {
            return validateThingValue();
          }
        }
        var setValue = function() {
          var setLiteralValue = function() {
            that[name] = value;
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
            that[name] = serializedValue;
            checkInverse();
          };
          //setValue logic
          if(propRange.hasSupertype(literal)) {
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
    supertypes: function() {
      var mySupertypes = this.property(subTypeOf);
      if(mySupertypes) {
        var theirSupertypes = [];
        mySupertypes.forEach( function(each) {
          theirSupertypes = theirSupertypes.concat(each.supertypes());
        })
        return mySupertypes.concat(theirSupertypes);
      } else {
        return [];
      }
    },
    supertypeURIs: function() {
      return this.supertypes().map(function(each) {return each.uri()});
    },
    types: function() {
      var myTypes = this.property(ofType);
      if(!myTypes)
        myTypes = [];
      myTypes.push(thing);
      var inheritedTypes = [];
      myTypes.forEach( function(each) {
        inheritedTypes = inheritedTypes.concat(each.supertypes());
      });
      return myTypes.concat(inheritedTypes);
    },
    typeURIs: function() {
      return this.types().map( function(each) {
        return each.uri()
      });
    },
    hasSupertype: function(type) {
      return (this.supertypes().indexOf(type) > -1) || (type == this)
    },
    ofType: function(type) {
      if(type.isAThing) {
        type = type.uri();
      }
      return this.typeURIs().indexOf(type) > -1
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
    subtypes: function (parent, cb) {
      var that = this;
      $.ajax({
        type: 'GET',
        async: true,
        url: this.db + '/_design/prototype/_view/subtypes?include_docs=true&key=' + JSON.stringify(parent.uri()),
        success: function(jsonData) {
          var data = JSON.parse(jsonData);
          var prototypeList = data.rows.map( function (each) {
            var localThing = that.lookupLocal(each.doc.uri);
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
    instances: function (aType, cb) {
      var that = this;
      $.ajax({
        type: 'GET',
        async: true,
        url: this.db + '/_design/prototype/_view/instances?include_docs=true&key='
        + JSON.stringify(aType.uri()),
        success: function(jsonData) {
          var data = JSON.parse(jsonData);
          var prototypeList = data.rows.map( function (each) {
            var localThing = that.lookupLocal(each.doc.uri);
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
      var aThing = this.lookupLocal(uri);
      if(!aThing) {
        aThing = this.persistedData[uri];
        if(!aThing) {
          var aThing = this.load(uri);
          if(!aThing) {
            throw new Error('URI not found');
          }
        }
      }
      return aThing;
    },
    save: function(thing) {
      this.localData[thing.uri()] = thing;
    },
    saveThingToCouch: function(thing, cb, rev) {
      var that = this;
      this.userInfoCached.postMake(thing);
      var doc = thing.serialize();
      var encodedURI = encodeURI(thing.uri().replace(/\//g, '_'));
      doc._id = encodedURI;
      doc.inferredProperties = {
        'uri:of-type': thing.typeURIs(),
        'uri:subtype-of': thing.supertypeURIs()
      };
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
      var functions = doc.properties.functions;
      delete doc.properties.functions;
      for(var prop in doc.properties) {
        var value = doc.properties[prop];
        if(functions.indexOf(prop) > -1)
          eval('value = ' + value);
        thingData.push([prop, value]);
      }
      var newThing = thing.createRaw(doc.uri, thingData, true);
      this.persistedData[newThing.uri()] = newThing;
      return newThing;
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
    }
  };

  if(!bootstrap) {
    initCommonThings(thingStore);
  }
  thingStore.userInfo(userInfo);
  return thingStore;
}
var initCommonThings = function(thingStore) {
  var dict = createDictionary(thingStore);
  label = dict('label');
  range = dict('range');
  domain = dict('domain');
  inverse = dict('inverse');
  ofType = dict('ofType');
  subTypeOf = dict('subTypeOf');
  collection = dict('collection');
  literal = dict('literal');
  type = dict('type');
  validate = dict('validate');
}