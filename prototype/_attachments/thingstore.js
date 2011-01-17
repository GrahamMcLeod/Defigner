var createThingStore = function(db, userInfo, bootstrap) {
  var thing = {
    _uri: 'uri:thing',
    _prototype: 'thing',
    isAThing: true,
    isAPrototype: true,
    toString: function() {
      return this.uri()
    },
    name: function(name) {
      if(name) {
        this.uri(this.parentURI() + '/' + name.replace(/ /g, '').toLowerCase());
      }
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
    prototype: function(uri) {
      if(uri) {
        this._prototype = uri;
      } else {
        return this._prototype;
      }
    },
    label: function() {
      var labelProp = thingStore.lookup('uri:thing/property/label');
      if(this.hasOwnProperty(label)) {
        return this.property(labelProp);
      } else {
        return this.uri();
      }
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
        var valueInfo = that.propertyLabel(prop);
        var isCollection = prop.property('collection');
        var isLiteral = prop.property(range).hasParent('uri:thing/literal');
        properties.push({
          label: prop.label(),
          value: valueInfo.value,
          isLiteral: isLiteral,
          isCollection: isCollection,
          inherited: valueInfo.inherited,
          uri: prop.uri()
        });
      });
      return {label: this.label(), uri: this.uri(), properties: properties};
    },
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
    make: function(nameOrArray, noChecks) {
      var newThing = this.parse(nameOrArray, noChecks);
      if(!noChecks) {
        newThing.property ("isAPrototype", false);
        if(nameOrArray) {
          newThing.store();
        }
        if(!this.isAPrototype) {
          this.isAPrototype = true;
          this.store();
        }
      }
      return newThing;
    },
    parse: function(nameOrArray, noChecks) {
      var F = function() {
      };
      F.prototype = this;
      var newThing = new F();
      newThing.prototype(this.uri());
      if(!nameOrArray) {
        return newThing;
      }
      if(typeof nameOrArray == 'string') {
        newThing.name(nameOrArray);
      } else {
        nameOrArray.forEach( function(each) {
          if (each[0] == 'name')
            newThing.name(each[1]);
          if (each[0] == 'uri')
            newThing.uri(each[1]);
        });
        newThing.extend(nameOrArray, noChecks);
      }
      return newThing;
    },
    store: function() {
      thingStore.save(this);
    },
    extend: function(array, noChecks) {
      var thing = this;
      array.forEach( function(each) {
        if(typeof each[1] == 'function') {
          thing.method(each[0], each[1]);
        } else {
          thing.property(each[0], each[1], noChecks);
        }
      });
      thingStore.save(this);
    },
    propertyLabel: function(prop) {
      var that = this;
      var inherited = true;
      if(this.hasOwnProperty(prop)) {
        inherited = false;
      }
      var value = that.property(prop);
      if(prop.isAThing) {
        if(prop.property('collection')) {
          if(!prop.property(range).hasParent('uri:thing/literal')) {
            value = value.map( function(each) {
              var label = each.label();
              return {label: label, uri: each.uri()}
            });
          }
        } else {
          if(!prop.property(range).hasParent('uri:thing/literal') && (value != null) && (value != "")) {
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
    property: function(name, value, noChecks) {
      var that = this;
      if(value === undefined) {
        var value = this[name];
        if(!value)
          return value;
        if((['prototype', range].indexOf(name) > -1) && (value != undefined))
          return thingStore.lookup(value);
        if(name.isAThing) {
          if(! name.property(range).hasParent('uri:thing/literal')) {
            var isCollection = name.property('collection');
            if(isCollection) {
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
        if(['name', 'uri', 'namespace', 'isAThing'].indexOf(name) > -1) {
          return
        };
        if(noChecks) {
          this[name] = value;
          return;
        }
        if(name.isAThing) {
          var propDomain = name.property(domain);
          var propRange = name.property(range);
          var isCollection = name.property('collection');
          var validRange = true;
          if(this.hasParent(propDomain)) {
            if(value == null) {
              if(isCollection) {
                this[name] = [];
              } else {
                this[name] = null;
              }
              return;
            }
            if(propRange.hasParent('uri:thing/literal')) {
              if(isCollection) {
                value.forEach( function(each) {
                  if(!propRange.validateProperty(each))
                    validRange = false;
                })
              } else {
                if(!propRange.validateProperty(value))
                  validRange = false;
              }
              if(validRange) {
                this[name] = value;
              }
            } else {
              if(isCollection) {
                value.forEach( function(each) {
                  if(!each.hasParent(propRange))
                    validRange = false;
                });
              } else {
                if(!value.hasParent(propRange))
                  validRange = false;
              }
              if(validRange) {
                if(isCollection) {
                  var serializedValue = value.map( function(each) {
                    return each.uri()
                  });
                } else {
                  var serializedValue = value.uri();
                }
                this[name] = serializedValue;

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
              } else {
                throw new Error('Range must be of type ' + propRange.label());
              }
            }
          } else {
            throw new Error(name.label() + ' has ' + propDomain.label() + ' as the domain. ' + that.label() + ' is therefore not valid.');
          }
        } else {
          if(value.isAThing) {
            this[name] = value.uri();
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
      if(!value)
        return this[name];
      this[name] = value;
    },
    parentURI: function() {
      return this.prototype();
    },
    parent: function() {
      return thingStore.lookup(this.parentURI());
    },
    hasParent: function(type) {
      if(type.isAThing)
        type = type.uri();
      if(this == type) {
        return true;
      } else {
        return this.prototype().indexOf(type) == 0;
      }
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
    var label = thingStore.lookup('uri:thing/property/label');
    var range = thingStore.lookup('uri:thing/property/range');
    var domain = thingStore.lookup('uri:thing/property/domain');
    var inverse = thingStore.lookup('uri:thing/property/collection/inverse');
    thing.property(label, 'Thing');
  }
  thingStore.userInfo(userInfo);
  return thingStore;
}