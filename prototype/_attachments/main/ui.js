var label = dict('label');
var thing = dict('thing');
var literal = dict('literal');
var number = dict('number');
var range = dict('range');
var domain = dict('domain');
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
          var innerHtml = '<li><span class="thing prototype" uri="' + each.prototype.uri() + '">' + each.prototype.label() + '</span>';
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
    $(selector + ' .thing[uri="' + focusedType.uri() + '"]').addClass('focus-type');
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
      return {uri: each.uri(), label: each.label()}
    });
    cb({label: parent.label(), uri: parent.uri(), things: formattedList});
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
      return {uri: instance.uri(), cells: cells};
    });
    cb({headings: headings, prototypeRow: {uri: parent.uri(), cells: prototypeRow}, instanceRows: instanceRows});
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
    var newItemButton = function() {
      $('#newItemButton').bind('click', function() {
        var newItem = prototype.make();
        newItem.property(label, '');
        displayThingDetailsEdit({
          focusThing: newItem,
          onSave: function(newProperties) {
            try {
              var name = newProperties.filter( function(each) {
                return each[0].uri() == label.uri();
              })[0][1];
              newItem.name(name);
              newItem.extend(newProperties);
              thingStore.commit();
              displayThingDetails(newItem);
            } catch(e) {
              alert('Item needs a label to store it.');
              thingStore.revert();
              displayThingDetails(prototype);
            }
          },
          onCancel: function() {
            thingStore.revert();
            displayThingDetails(prototype);
          }
        });
      });
    }
    newItemButton();
  });
}
var displayThingDetails = function(focusThing) {
  var view = formatView(focusThing.view());
  var html = ich.thingDetailsTemplate(view);
  $('#thing-details').html(html);
  addThingEvents();
  $('#itemEditButton').bind('click', function() {
    displayThingDetailsEdit({
      focusThing: focusThing
    });
  });
};
var displayThingDetailsEdit = function(options) {
  var focusThing = options.focusThing;
  var onSave = options.onSave;
  var onCancel = options.onCancel;
  var view = formatView(focusThing.view());
  var html = ich.thingDetailsEditTemplate(view);

  $('#thing-details').html(html);

  thingListInputField({
    domElement: 'input[class*="select-thing-list"]'
  });
  thingSingleInputField({
    domElement: 'input[class*="select-single-thing"]'
  });

  thingInputField({
    domElement: 'input[name*="new-property"]',
    onSelect: function(event, ui) {
      var prop = thingStore.lookup(ui.item.uri);
      try {
        focusThing.property(prop, null);
        displayThingDetailsEdit(options);
      } catch(e) {
        alert(e);
      }
      return false;
    }
  });

  $('#itemCancelButton').bind('click', function() {
    if(onCancel) {
      onCancel();
    } else {
      thingStore.revert();
      displayThingDetails(focusThing);
    }
  });
  $('#itemSaveButton').bind('click', function() {
    var thingProperties = view.properties.map( function(prop) {
      var propType = thingStore.lookup(prop.uri);
      var value;
      if(prop.literalProps) {
        value = $('input[prop-uri="' + prop.uri + '"]').val();
        if(propType.property(range).hasParent(number)) {
          value = parseFloat(value);
        }
      }
      if(prop.literalListProps) {
        var value = $.makeArray($('[prop-uri="' + propType.uri() + '"] .literal').map( function() {
          return $(this).val();
        }));
        if(propType.property(range).hasParent(number)) {
          value = value.map( function(each) {
            return parseFloat(value);
          })
        }
      }
      if(prop.thingProps) {
        var URI = $('[prop-uri="' + propType.uri() + '"] .thing').first().attr('uri');
        if(!URI) {
          value = null;
        } else {
          value = thingStore.lookup(URI);
        }
      }
      if(prop.thingListProps) {
        var URIs = $.makeArray($('[prop-uri="' + propType.uri() + '"] .thing').map( function() {
          return $(this).attr('uri')
        }));
        value = URIs.map( function(each) {
          return thingStore.lookup(each)
        });
      }
      return [propType, value];
    });
    if(onSave) {
      onSave(thingProperties);
    } else {
      try {
        focusThing.extend(thingProperties);
        thingStore.commit();
        displayThingDetails(focusThing);
      } catch(e) {
        alert(e);
      }
    }
  });
}
var thingListInputField = function(options) {
  thingInputField({
    domElement: options.domElement,
    onSelect: function(event, ui) {
      $(this).before('<div><div class="thing" uri="' + ui.item.uri + '">' + ui.item.value + '</div>&nbsp;<span onClick="$(this).parent().remove()">-</span><br></div>');
      this.value = '';
      return false;
    }
  });
}
var thingSingleInputField = function(options) {
  thingInputField({
    domElement: options.domElement,
    onSelect: function(event, ui) {
      $(this).parent().find('.thing').text(ui.item.value).attr('uri', ui.item.uri).parent().removeClass('invisible');
      $(this).addClass('invisible');
      this.value = '';
      return false;
    }
  });
}
var thingInputField = function(options) {
  var domElement = options.domElement;
  var onSelect = options.onSelect;
  var split = function ( val ) {
    return val.split( /,\s*/ );
  }
  var extractLast= function ( term ) {
    return split( term ).pop();
  }
  $(domElement).each( function() {
    var focus = $(this);
    var propType = thingStore.lookup($(this).attr('prop-uri'));
    var propRange = propType.property(range);
    thingStore.instances(propRange, function(instances) {
      var data = instances.map( function(each) {
        return {label: each.label(), uri: each.uri()}
      });
      data.unshift({label: propRange.label(), uri: propRange.uri()});
      $(focus).each( function() {
        var inputfield = $(this);
        inputfield.autocomplete({
          minLength: 0,
          source: function( request, response ) {
            response($.ui.autocomplete.filter(data, extractLast(request.term)));
          },
          focus: function() {
            return false;
          },
          select: onSelect
        })
      });
    });
  });
}
var addRemovableEditField = function(domElement, classes) {
  var newField = $(domElement).parent().clone();
  $(domElement).removeAttr('onFocus').addClass('literal').next().removeClass('invisible');
  $(domElement).parent().after(newField);
}
var formatView = function(view) {
  var viewData = {
    label: view.label,
    uri: view.uri
  };
  var properties = view.properties.map( function(each) {
    if(each.isCollection) {
      if(each.isLiteral) {
        each.literalListProps = true;
        return each;
      } else {
        each.thingListProps = true;
        return each;
      }
    } else {
      if(each.isLiteral) {
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
  var browserTabUpdate = function() {
    browserViewTypeSelector(focusItem);
  };
  var tableTabUpdate = function() {
    tableViewTypeSelector(focusItem);
  }
  var graphViewUpdate = function() {
    thingStore.instances(focus.type(), function(instances) {
      renderGraph (instances[0].uri(), [], [], {levels: 0});
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