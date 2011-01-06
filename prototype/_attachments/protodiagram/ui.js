var label = dict('label');

var loadPrototypeList = function(parent, cb) {
  thingStore.prototypes(parent, function(prototypeList) {
    formattedList = prototypeList.map( function(each) {
      return {uri: each.uri, label: each.property(label)}
    });
    cb(formattedList);
  })
}
var loadPrototypeListRecursive = function(parent, cb) {
  thingStore.prototypes(parent, function(prototypeList) {
    var prototypeData = prototypeList.map( function(each) {
      return {prototype: each, subprototypes: []}
    });
    arrayForEachLinear(prototypeData, function(each, forEachCb) {
      loadPrototypeListRecursive(each.prototype, function(data) {
        each.subprototypes = data;
        forEachCb();
      })
    }, function() {
      cb(prototypeData);
    });
  })
}
var prototypeListHtml = function(parent, cb) {
  loadPrototypeListRecursive(parent, function(data) {
    var parseData = function(input) {
      var html = '<ul>'
      html += input.map( function(each) {
        var innerHtml = '<li><span class="thing prototype" uri="' + each.prototype.uri + '">' + each.prototype.label() + '</span>';
        if(each.subprototypes.length > 0) {
          innerHtml += parseData(each.subprototypes);
        }
        return innerHtml + '</li>';
      }).join('\n');
      html += '</ul>';
      return html;
    }
    cb(parseData(data));
  })
}
var loadInstanceList = function(parent, cb) {
  thingStore.instances(parent, function(prototypeList) {
    formattedList = prototypeList.map( function(each) {
      return {uri: each.uri, label: each.property(label)}
    });
    cb({label: parent.label(), uri: parent.uri, things: formattedList});
  })
}
var displayPrototypeList = function(parent, domElement, cb) {
  prototypeListHtml(parent, function(html) {
    $(domElement).html(html);
    cb();
  })
}
var displayInstanceList = function(prototype, domElement, cb) {
  loadInstanceList(prototype, function(data) {
    var html = ich.instanceListTemplate(data);
    $('#instance-list').html(html);
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
  $(".prototype").bind('click', function() {
    var thing = thingStore.lookup($(this).attr('uri'));
    displayInstanceList(thing, '#instance-list', function() {
      
    })
  })
}
$( function() {
  var focusItem = dict('thing');
  displayPrototypeList(focusItem, '#prototype-list', function() {
    $("#prototype-list").treeview();
    addThingInteraction();
  });
  $("#tabs").tabs({selected: 0}).bind('tabsshow', function(event, ui) {
    if(ui.index == 0) {
      displayPrototypeList(focusItem, '#prototype-list', function() {
        $("#prototype-list").treeview();
        addThingInteraction();
      });
    }
    if(ui.index == 2) {
      // Initialise collections and set initial start item, then fetch data and render
      var startItem = 'uri:thing/person/graham';
      renderGraph ('uri:thing/person/graham', [], [], {levels: 0});
    }
  });
  $("#prototype-list").html();
});
