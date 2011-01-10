var label = dict('label');
var thing = dict('thing');
var literal = dict('literal');
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
  addThingEvents();
  $('#itemEditButton').bind('click', function() {
    displayThingDetailsEdit(thing);
  });
};
var displayThingDetailsEdit = function(thing) {
  var view = formatView(thing.view());
  var editedProperties = {};
  var propertyValueChanged = function(propType, value) {
    editedProperties[propType] = value;
  }
  var propertyValueAdded = function(propType, value) {
    if(!editedProperties[propType])
      editedProperties[propType] = [];
    if(editedProperties[propType].filter(function(each) {return each.uri == value.uri}).length == 0)
      editedProperties[propType].push(value);
  }
  var html = ich.thingDetailsEditTemplate(view);
  $('#thing-details').html(html);
  var split = function (val) {
    return val.split( /,\s*/ );
  }
  var extractLast = function (term) {
    return split(term).pop();
  }
  $('input[class="select-things"]').each( function() {
    var focus = this;
    var propType = thingStore.lookup($(this).attr('prop-uri'));
    thingStore.instances(propType.property('range'), function(instances) {
      var data = instances.map( function(each) {
        return {label: each.label(), uri: each.uri}
      });
      $(focus).autocomplete({
        minLength: 0,
        source: function( request, response ) {
          response($.ui.autocomplete.filter(data, extractLast(request.term)));
        },
        focus: function() {
          return false;
        },
        select: function( event, ui ) {
          var terms = split( this.value );
          terms.pop();
          terms.push( ui.item.value );
          terms.push( "" );
          this.value = terms.join( ", " );
          propertyValueAdded(propType, ui.item);
          return false;
        }
      });
    });
  });
  $('#itemCancelButton').bind('click', function() {
    displayThingDetails(thing);
  });
  $('#itemSaveButton').bind('click', function() {
    var newView = {uri: view.uri, properties: []};
    view.properties.forEach( function(prop) {
      var propType = thingStore.lookup(prop.uri);
      var domValue = $('input[prop-uri="' + prop.uri + '"]').val();
      if(propType.property('range').hasParent(literal)) {
        if(prop.value != domValue) {
          prop.value = domValue
          newView.properties.push(prop);
        }
      } else {
        if(editedProperties[prop.uri]) {
          var newPropValue = editedProperties[prop.uri];
          prop.value.forEach( function(each) {
            if((domValue.indexOf(each.label) > -1) && (newPropValue.filter(function(newVal) {return newVal.uri == each.uri}) == 0)) {
              newPropValue.push(each);
            }
          });
          prop.value = newPropValue;
          newView.properties.push(prop);
        }
      }
    });
    var thingProps = newView.properties.map( function(each) {
      var propType = thingStore.lookup(each.uri);
      if(each.literalProps) {
        return [propType, each.value];
      }
      if(each.thingListProps) {
        return [propType, each.value.map( function(value) {
          return thingStore.lookup(value.uri)
        })];
      }
    })
    thing.extend(thingProps);
    //thingStore.commit();
    displayThingDetails(thing);
  });
}
var formatView = function(view) {
  var viewData = {
    label: view.label,
    uri: view.uri
  };
  var properties = view.properties.map( function(each) {
    if(each.value.constructor == Array) {
      if(each.literal) {
        for(var i=0; i<each.value.length-1; i++) {
          each.value[i] = each.value[i] + ', ';
        }
        each.literalListProps = true;
        return each;
      } else {
        for(var i=0; i<each.value.length-1; i++) {
          each.value[i].label = each.value[i].label + ', ';
        }
        each.thingListProps = true;
        return each;
      }
    } else {
      if(each.literal) {
        each.literalProps = true;
        return each;
      } else {
        each.thingProps = true;
        return each;
      }
    }
  });
  viewData.properties = properties;
  return viewData;
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
// Main Logic
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
/*
 var data = [
 {label: 'name', value: 'Furniture'},
 {label: 'age', value: 8}
 ];

 renderForm({
 data: data,
 domElement: '#form-tag',
 onSubmit: function(newData) {
 //update thing

 }
 });
 */