
$(function() {
  var userInfo = {
    name: 'example_user',
    addUserInfo: function(thing) {
      thing.property('modified_by', this.name);
    },
    postMake: function(thing) {
      thing.property('last_modified', new Date());
      this.addUserInfo(thing);
    }
  };
  thingStore.userInfo(userInfo);
  dict = createDictionary(thingStore);
  runExamples(dict);
  thingStore.commit();
});