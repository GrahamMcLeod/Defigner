ometa ModelParser <: Parser {
  eval = thingDef*:x -> x,
  thingDef = thingHead:head  '\n' thingBody:body '\n'* -> {label: head.name, type: head.type, properties: body},
  thingHead = thingName:name spaces '(' thingName:type ')' -> {type: type, name: name} |
              thingName:name -> {type: 'Thing', name: name},
  thingName = spaces firstAndRest(`upper, `letterOrDigit):name -> name.join(''),
  thingBody = propertyDef*:props -> props,
  propertyDef = propertyName:prop spaces ":" spaces propertyValue:value '\n' -> {propName: prop, propValue: value},
  propertyName = spaces firstAndRest(`lower, `letterOrDigit):name -> name.join(''),
  propertyValue = variableValue:x -> x |
                  stringValue:x -> x |
                  numberValue:x -> x,
  variableValue = thingName:x -> {type: 'thing', value: x},
  stringValue = "'" letterOrDigit*:x "'" -> {type: 'string', value: x.join('')},
  numberValue = digit*:x -> {type: 'number', value: parseFloat(x.join(''))}
}

var ModelTranslator = function() {
  var translate = function(data) {
    var code = 'var Thing = thingStore.lookup("uri:thing");\n';
    code += 'var labelProp = thingStore.lookup("uri:thing/property/label");\n';
    var thingsInScope = ['Thing'];
    code += data.map(function(thingData) {
      var label = thingData.label;
      var type = thingData.type;
      var thingCode = '';
      var properties = thingData.properties.map(function(prop) {
        if(prop.propValue.type == 'thing') {
          var propValue = prop.propValue.value;
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
      if(thingsInScope.indexOf(label) > -1) {
        thingCode = label + '.extend([ \n' + properties.join(',\n') + '\n]);\n';
      } else {
        thingsInScope.push(label);
        properties.push('  [labelProp,' + JSON.stringify(label) + ']');
        thingCode = 'var ' + label + ' = ' + type + '.make([ \n' + properties.join(',\n') + '\n]);\n';
      }
      return thingCode;
    }).join('\n');
    return code;
  };
  return {translate: translate}
}

var testAdvanced = "

  Graham
  
  Person(Thing)
    owns: Furniture
    knows: Person
    description: 'sometext'
    someNumber: 8
  
  Mirko(Person)
    owns: Chair
    knows: Graham
  
  Graham(Person)
    owns: Table
";
var parsedModel = ModelParser.matchAll(testAdvanced, 'eval');
console.log(parsedModel);
ModelTranslator().translate(parsedModel);