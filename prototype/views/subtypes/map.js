function(doc) {
  isAType = doc.inferredProperties['uri:of-type'].indexOf('uri:type') > -1;
  
  if(isAType) {
    var supertypes = doc.inferredProperties['uri:subtype-of'];
    if(supertypes.length == 0) {
      emit('uri:type', doc.uri);
    }
    supertypes.forEach(function(each) {
      emit(each, doc.uri);
    })  
  }
  
};