
$(function() {
  var userInfo = {
    name: 'bootstrap_user',
    addUserInfo: function(thing) {
      thing[modifiedBy] = this.name;
    },
    postMake: function(thing) {
      thing[lastModified] = new Date();
      this.addUserInfo(thing);
    }
  };
  thingStore = createThingStore('prototype', userInfo, true);
  bootstrap(thingStore);
  var dict = createDictionary(thingStore);
  var lastModified = dict('lastModified');
  var modifiedBy = dict('modifiedBy');
  var ofType = dict('ofType');
  var systemThing = dict('systemThing');
  initCommonThings(thingStore);
  thingStore.commit();
});