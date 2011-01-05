var label = dict('label');

var loadPrototypeList = function(parent, cb) {
  thingStore.prototypes(parent, function(prototypeList) {
    formattedList = prototypeList.map( function(each) {
      return {uri: each.uri, label: each.property(label)}
    });
    var html = ich.prototypeListTemplate({things: formattedList});
    $('#prototype-list').html(html);
    cb();
  })
}

var loadInstanceList = function(parent, cb) {
  thingStore.instances(parent, function(prototypeList) {
    formattedList = prototypeList.map( function(each) {
      return {uri: each.uri, label: each.property(label)}
    });
    var html = ich.instanceListTemplate({things: formattedList});
    $('#instance-list').html(html);
    cb();
  })
}

var loadThingDetails = function(thing) {
  var view = formatView(thing.view());
  var html = ich.thingDetailsTemplate(view);
  $('#thing-details').html(html);
}

var formatView = function(view) {
  var joinedList = view.properties.map ( function (each) {
    if(typeof each.value == 'object') {
      var list=each.value.map ( function (e) {
        return e.label
      }).join(', ');
      each.value=list;
      return each;
    } else {
      return each;
    }
  });
  view.properties=joinedList;
  return view;
}
// Convert logical view to HTML table structure
var viewToHTML = function (view) {
  formatView(view);
  return  ich.outForm(view,true);
}
var addThingInteraction = function() {
  $(".thing").bind('click', function() {

  })
}

$(function() {
  var focusItem = dict('thing');
  loadPrototypeList(focusItem, function() {
    loadInstanceList(focusItem, function() {
      addThingInteraction();
    });
  });
  $("#tabs").tabs({selected: 0}).bind('tabsshow', function(event, ui) {
    if(ui.index == 0) {
      loadPrototypeList(focusItem, function() {
        loadInstanceList(focusItem, function() {
          addThingInteraction();
        });
      });
    }
    if(ui.index == 2) {
      // Initialise collections and set initial start item, then fetch data and render
      var startItem = 'uri:thing/person/graham';
      renderGraph ('uri:thing/person/graham', [], [], {levels: 2});
    }
  });
  $("#thing-list").html();
});
