function(doc) {
  doc.inferredProperties['uri:of-type'].forEach( function(each) {
    emit(each, doc.uri);
  });
};