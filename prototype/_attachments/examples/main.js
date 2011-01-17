
$(function() {
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
  var lastModified = dict('lastModified');
  var modifiedBy = dict('modifiedBy');
  runExamples(dict);
  thingStore.commit();
});