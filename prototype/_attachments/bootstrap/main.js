
$(function() {
  var userInfo = {
    name: 'bootstrap_user',
    addUserInfo: function(thing) {
      thing.property('modified_by', this.name);
    },
    postMake: function(thing) {
      thing.property('last_modified', new Date());
      this.addUserInfo(thing);
      var ofType = thingStore.lookup('uri:thing/property/collection/of_type');
      var systemThing = thingStore.lookup('uri:thing/system_thing');
      thing.property(ofType.uri(), [systemThing.uri()]);
    }
  };
  thingStore = createThingStore('prototype', userInfo, true);
  
  bootstrap(thingStore);
  thingStore.commit();
});