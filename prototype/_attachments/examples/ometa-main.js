
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
  thingStore = createThingStore('prototype', userInfo);
  dict = createDictionary(thingStore);
  var code = ModelTranslator().translate($('script[language="modeling"]').text());
  console.log(code);
  eval(code);
  thingStore.commit();
});