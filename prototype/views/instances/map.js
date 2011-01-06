function(doc) {
if (!doc.thing.isAPrototype) {
  var valid = true;
  var types = doc.thing['uri:thing/property/collection/of_type'];
  if(types) {
    if(types.indexOf("uri:thing/system_thing") > -1) {
      valid = false;
    }
  }
  if(valid) {
    emit(doc.thing.prototype, doc.thing.uri);
    /*var protoURI = doc.thing.prototype.split('/');
    var emitURIs = function(URIs) {
      emit(URIs.join('/'), doc.thing.uri);
      URIs.pop();
      if(URIs.length > 0) {
        emitUri(URIs);
      }
    }
    emitURIs(protoURI);*/
  }
}
};