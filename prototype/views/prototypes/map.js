function(doc) {
  if (doc.thing.isAPrototype) {
    var valid = true;
    /*
    var types = doc.thing['uri:thing/property/collection/of_type'];
    if(types) {
      if(types.indexOf("uri:thing/system_thing") > -1) {
        valid = false;
      }
    }*/
    if(valid) {
      emit(doc.thing._prototype, doc.thing._uri);    
    }
  }
};