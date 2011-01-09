var label = dict('label');
var thing = dict('thing');
var focus = {
  currType: thing,
  currItem: thing,
  currRepresentation: undefined,
  currModel: undefined,
  currUIView: 'thing-browser',
  type: function(type) {
    if(type) {
      this.currType = type
    } else {
      return this.currType;
    }
  },
  item: function(item) {
    if(item) {
      this.currItem = item
    } else {
      return this.currItem;
    }
  }
};

var typeSelector = function(options) {
  var selector = options.selector;
  var rootType = options.rootType;
  var focusedType = options.focusedType;
  var onSelectType = options.onSelectType;
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
  };
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
  };
  var displayPrototypeList = function(parent, domElement, cb) {
    prototypeListHtml(parent, function(html) {
      $(domElement).html(html);
      cb();
    })
  };
  displayPrototypeList(rootType, selector, function() {
    $(selector).treeview({
      //collapsed: true
    });
    $(selector + ' .thing[uri="' + focusedType.uri + '"]').addClass('focus-type');
    onSelectType(focusedType);
    $(selector + " .prototype").bind('click', function() {
      var thing = thingStore.lookup($(this).attr('uri'));
      $('.focus-type').removeClass('focus-type');
      $(this).addClass('focus-type');
      onSelectType(thing, $(this));
    });
  });
}
var browserViewTypeSelector = function() {
  var onTypeSelect = function(type, domElement) {
    focus.type(type);
    displayInstanceList(type, '#instance-list', function() {
    })
  }
  typeSelector({
    selector: '#prototype-list',
    rootType: thing,
    focusedType: focus.type(),
    onSelectType: onTypeSelect
  });
};
var tableViewTypeSelector = function() {
  var onTypeSelect = function(type, domElement) {
    focus.type(type);
    displayTableData(type);
  }
  typeSelector({
    selector: '#prototype-list-table',
    rootType: thing,
    focusedType: focus.type(),
    onSelectType: onTypeSelect
  });
}
var loadInstanceList = function(parent, cb) {
  thingStore.instances(parent, function(prototypeList) {
    formattedList = prototypeList.map( function(each) {
      return {uri: each.uri, label: each.property(label)}
    });
    cb({label: parent.label(), uri: parent.uri, things: formattedList});
  })
}
var formatPropertyValue = function(value, inherited) {
  if(value.constructor == Array) {
    value = '<div class="thing">' + value.map( function(each) {
      return each.label
    }).join('</div><div class="thing">') + '</div>';
  } else {
    if(value.constructor == Object) {
      return '<div class="thing">' + value.label + '</div>';
    }
  }
  if(inherited) {
    return '<span class="inherited">[' + value + ']</span>';
  } else {
    return value;
  }
}
var loadTableData = function(parent, cb) {
  thingStore.instances(parent, function(instances) {
    var parentProps = parent.properties();
    var headings = parentProps.map( function(each) {
      return each.label();
    });
    var prototypeRow = parentProps.map( function(prop) {
      var valueInfo = parent.propertyLabel(prop);
      return formatPropertyValue(valueInfo.value, valueInfo.inherited);
    });
    var instanceRows = instances.map( function(instance) {
      var cells = parentProps.map( function(prop) {
        var valueInfo = instance.propertyLabel(prop);
        var value = valueInfo.value;
        var inherited = valueInfo.inherited;
        return formatPropertyValue(value, inherited);
      });
      return {uri: instance.uri, cells: cells};
    });
    cb({headings: headings, prototypeRow: {uri: parent.uri, cells: prototypeRow}, instanceRows: instanceRows});
  });
}
var displayTableData = function(parent) {
  loadTableData(parent, function(data) {
    var html = ich.tableTemplate(data);
    $('#table').html(html);
  })
}
var displayInstanceList = function(prototype, domElement, cb) {
  loadInstanceList(prototype, function(data) {
    var html = ich.instanceListTemplate(data);
    $('#instance-list').html(html);
    addThingEvents();
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
var addThingEvents = function() {
  $(".thing").bind('click', function() {
    var thing = thingStore.lookup($(this).attr('uri'));
    displayThingDetails(thing);
  })
};
$( function() {
  var focusItem = dict('thing');
  focus.type(focusItem);
  var furniture = thingStore.lookup('uri:thing/furniture');
  var table = thingStore.lookup('uri:thing/furniture/table');
  var browserTabUpdate = function() {
    browserViewTypeSelector(focusItem);
  };
  var tableTabUpdate = function() {
    tableViewTypeSelector(focusItem);
  }
  var graphViewUpdate = function() {
    thingStore.instances(focus.type(), function(instances) {
      renderGraph (instances[0].uri, [], [], {levels: 0});
    })
  }
  browserTabUpdate();
  $("#tabs").tabs({selected: 0}).bind('tabsshow', function(event, ui) {
    if(ui.index == 0) {
      browserTabUpdate();
    }
    if(ui.index == 1) {
      tableTabUpdate();
    }
    if(ui.index == 2) {
      graphViewUpdate();
    }
  });
  $("#prototype-list").html();
});