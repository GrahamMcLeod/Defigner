var userInfo = {
  name: 'example_user',
  addUserInfo: function(thing) {
    thing.property(modifiedBy, this.name);
  },
  postMake: function(thing) {
    thing.property(lastModified, new Date());
    this.addUserInfo(thing);
  }
};
thingStore = createThingStore('prototype', userInfo);
dict = createDictionary(thingStore);
var label = dict('label');
var collection = dict('collection');
var literal = dict('literal');
var modifiedBy = dict('modifiedBy');
var lastModified = dict('lastModified');

// Define functions
// Fetch a collection of objects from the store using a named starting point and following 1 level of relationships
var fetchGraph = function (startURI, nodes, links, options) {
  var startNode = thingStore.lookup(startURI);
  var addNode = function(node) {
    var pos;
    var added = false;
    nodes.forEach( function(each, i) {
      if(each.uri == node.uri()) {
        pos = i;
      }
    });
    if(!pos && (pos != 0)) {
      var tempNode = {
        nodeName: node.property(label),
        thing: node,
        group: 1,
        uri: node.uri(),
      };
      if(options) {
        if(options.x && options.y) {
          tempNode.x = options.x-50;
          tempNode.y = options.y-50;
        }
      }
      var pos = nodes.push(tempNode)-1;
      added = true;
    }
    return {idx: pos, added: added};
  }
  var linkExists = function(source, target) {
    return (links.filter( function(each) {
        return ((each.source == source) && (each.target == target)) | ((each.source == target) && (each.target == source));
      }).length > 0)
  }
  var sourcePosInfo = addNode(startNode);
  var rels = startNode.properties().filter( function(each) {
    return each.ofType(collection) && (!each.ofType(literal))
  });
  rels.forEach( function(rel) {
    startNode.property(rel).forEach( function(each) {
      var targetPosInfo = addNode(each);
      if(!linkExists(sourcePosInfo.idx, targetPosInfo.idx)) {
        var tempLink = {source: sourcePosInfo.idx, target:targetPosInfo.idx, value:1, relName: rel.property(label)};
        links.push(tempLink);
      }
      if(options) {
        if(options.levels) {
          if(options.levels > 0) {
            var newOptions = {levels: options.levels-1};
            fetchGraph(each, nodes, links, newOptions);
          }
        }
      }
    });
  });
};

