var label = dict('label');

var loadPrototypeList = function(parent, cb) {
  thingStore.prototypes(parent, function(prototypeList) {
    formattedList = prototypeList.map( function(each) {
      return {uri: each.uri, label: each.property(label)}
    });
    cb(formattedList);
  })
}
var loadInstanceList = function(parent, cb) {
  thingStore.instances(parent, function(prototypeList) {
    formattedList = prototypeList.map( function(each) {
      return {uri: each.uri, label: each.property(label)}
    });
    cb(formattedList);
  })
}
var loadThingList = function(parent, cb) {
  loadPrototypeList(parent, function(prototypeList) {
    loadInstanceList(parent, function(instanceList) {
      var templateData = {
        label: parent.label(),
        uri: parent.uri,
        prototypes: prototypeList,
        instances: instanceList
      };
      var html = ich.thingListTemplate(templateData);
      cb(html);
    })
  })
}
var displayThingList = function(parent, domElement, cb) {
  loadThingList(parent, function(html) {
    $(domElement).html(html);
    addThingInteraction();
    if(cb) {
      cb();
    }
  })
}
var displayThingDetails = function(thing) {
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
  return ich.outForm(view,true);
}
var addThingInteraction = function() {
  $(".tree-prototype").bind('click', function() {
    var thing = thingStore.lookup($(this).attr('uri'));
    var domElement = $(this);
    loadThingList(thing, function(html) {
      domElement.removeClass('tree-prototype');
      domElement.unbind();
      var newSubList = $(domElement).html(html);
      $(domElement).treeview({
        add: newSubList
      });
      addThingInteraction();
    })
  })
}
$( function() {
  var focusItem = dict('thing');
  displayThingList(focusItem, '#thing-list', function() {
    $("#thing-list").treeview();
  });
  $("#tabs").tabs({selected: 0}).bind('tabsshow', function(event, ui) {
    if(ui.index == 0) {
      displayThingList(focusItem, '#thing-list', function() {
        $("#thing-list").treeview();
      });
    }
    if(ui.index == 2) {
      // Initialise collections and set initial start item, then fetch data and render
      var startItem = 'uri:thing/person/graham';
      renderGraph ('uri:thing/person/graham', [], [], {levels: 0});
    }
  });
  $("#thing-list").html();
});
