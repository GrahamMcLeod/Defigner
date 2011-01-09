ModelParser=objectThatDelegatesTo(Parser,{
"eval":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._many((function(){return this._apply("thingDef")}));return x}).call(this)},
"thingDef":function(){var $elf=this,_fromIdx=this.input.idx,head,body;return (function(){head=this._apply("thingHead");this._applyWithArgs("exactly","\n");body=this._apply("thingBody");this._many((function(){return this._applyWithArgs("exactly","\n")}));return ({"label": head["name"],"type": head["type"],"properties": body})}).call(this)},
"thingHead":function(){var $elf=this,_fromIdx=this.input.idx,name,type,name,name,type;return this._or((function(){return (function(){name=this._apply("thingName");this._apply("spaces");this._applyWithArgs("exactly","(");type=this._apply("thingName");this._applyWithArgs("exactly",")");return ({"type": type,"name": name})}).call(this)}),(function(){return (function(){name=this._apply("thingName");return ({"type": "Thing","name": name})}).call(this)}),(function(){return (function(){name=this._apply("propertyTypeName");this._apply("spaces");this._applyWithArgs("exactly","(");type=this._apply("thingName");this._applyWithArgs("exactly",")");return ({"type": type,"name": name})}).call(this)}))},
"thingName":function(){var $elf=this,_fromIdx=this.input.idx,name;return (function(){this._apply("spaces");name=this._applyWithArgs("firstAndRest","upper","letterOrDigit");return name.join("")}).call(this)},
"propertyTypeName":function(){var $elf=this,_fromIdx=this.input.idx,name;return (function(){this._apply("spaces");name=this._many((function(){return this._apply("letterOrDigit")}));return name.join("")}).call(this)},
"thingBody":function(){var $elf=this,_fromIdx=this.input.idx,props;return (function(){props=this._many((function(){return this._apply("propertyDef")}));return props}).call(this)},
"propertyDef":function(){var $elf=this,_fromIdx=this.input.idx,prop,value;return (function(){prop=this._apply("propertyName");this._apply("spaces");this._applyWithArgs("token",":");this._apply("spaces");value=this._apply("propertyValue");this._applyWithArgs("exactly","\n");return ({"propName": prop,"propValue": value})}).call(this)},
"propertyName":function(){var $elf=this,_fromIdx=this.input.idx,name;return (function(){this._apply("spaces");name=this._applyWithArgs("firstAndRest","lower","letterOrDigit");return name.join("")}).call(this)},
"propertyValue":function(){var $elf=this,_fromIdx=this.input.idx,x,x,x;return this._or((function(){return (function(){x=this._apply("variableValue");return x}).call(this)}),(function(){return (function(){x=this._apply("stringValue");return x}).call(this)}),(function(){return (function(){x=this._apply("numberValue");return x}).call(this)}))},
"variableValue":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("thingHead");return ({"type": "thing","value": x})}).call(this)},
"stringValue":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){this._applyWithArgs("token","\'");x=this._many((function(){return this._apply("valueChar")}));this._applyWithArgs("token","\'");return ({"type": "string","value": x.join("")})}).call(this)},
"valueChar":function(){var $elf=this,_fromIdx=this.input.idx,x,x;return this._or((function(){return (function(){x=this._apply("letterOrDigit");return x}).call(this)}),(function(){return (function(){x=this._apply("space");return x}).call(this)}))},
"numberValue":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._many((function(){return this._apply("digit")}));return ({"type": "number","value": parseFloat(x.join(""))})}).call(this)}})

var ModelTranslator = function() {
  var translateIntermediate = function(data) {
    var code = 'var Thing = thingStore.lookup("uri:thing");\n';
    code += 'var label = thingStore.lookup("uri:thing/property/label");\n';
    code += 'var Property = thingStore.lookup("uri:thing/property");\n';
    code += 'var Relationship = thingStore.lookup("uri:thing/property/collection/relationship");\n';
    code += 'var String = thingStore.lookup("uri:thing/literal/string");\n';
    var thingsInScope = ['Thing', 'label', 'Relationship', 'Property', 'String'];
    code += data.map(function(thingData) {
      var label = thingData.label;
      var type = thingData.type;
      var thingCode = '';
      var relTargetsToCreate = [];
      if(thingsInScope.indexOf(type) == -1) {
        relTargetsToCreate.push(type);
      }
      var properties = thingData.properties.map(function(prop) {
        if(prop.propValue.type == 'thing') {
          var propValue = prop.propValue.value.name;
          if(thingsInScope.indexOf(propValue) == -1) {
            relTargetsToCreate.push(prop.propValue.value);
          }
        } else {
          var propValue = JSON.stringify(prop.propValue.value);
        }
        if(thingsInScope.indexOf(prop.propName) > -1) {
          var propertyName = prop.propName;
        } else {
          var propertyName = JSON.stringify(prop.propName);
        }
        return '  [' + propertyName + ',' + propValue + ']'
      });
      thingCode += relTargetsToCreate.map(function(each) {
        var relTargetCode = '';
        if(thingsInScope.indexOf(each.type) == -1) {
          relTargetCode += 'var ' + each.type + ' = Thing.make([["name", "' + each.type + '"], [label, "' + each.type + '"]]);\n';
          thingsInScope.push(each.type);
        }
        thingsInScope.push(each.name);
        return relTargetCode += 'var ' + each.name + ' = ' + each.type + '.make([["name", "' + each.name + '"], [label, "' + each.name + '"]]);'
      }).join('\n') + '\n';
      if(thingsInScope.indexOf(label) > -1) {
        thingCode += label + '.extend([ \n' + properties.join(',\n') + '\n]);\n';
      } else {
        thingsInScope.push(label);
        properties.push('  [label,' + JSON.stringify(label) + ']');
        properties.push('  ["name",' + JSON.stringify(label) + ']');
        thingCode += 'var ' + label + ' = ' + type + '.make([ \n' + properties.join(',\n') + '\n]);\n';
      }
      return thingCode;
    }).join('\n');
    return code;
  };
  var getIntermediate = function(modelCode) {
    return ModelParser.matchAll(modelCode, 'eval');
  }
  var translate = function(modelCode) {
    return this.translateIntermediate(this.getIntermediate(modelCode))
  }
  return {translate: translate, getIntermediate: getIntermediate, translateIntermediate: translateIntermediate}
}

/*
$(function() {
  var code = ModelTranslator().translate($('script[language="modeling"]').text());
  console.log(code);
})

*/
