function(doc) {
  isAType = doc.inferredProperties['uri:of-type'].indexOf('uri:type') > -1;
  
  if(isAType) {
    var supertypes = doc.properties['uri:subtype-of'];
    if(!supertypes) supertypes = [];
    if(supertypes.length == 0) {
      emit('uri:thing', doc.uri);
    }
    supertypes.forEach(function(each) {
      emit(each, doc.uri);
    })  
  }
  
};