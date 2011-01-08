ometa ModelParser <: Parser {
  eval = thingDef*:x -> x,
  thingDef = thingHead:head  '\n' thingBody:body '\n'* -> {label: head.name, type: head.type, properties: body},
  thingHead = thingName:name spaces '(' thingName:type ')' -> {type: type, name: name} |
              thingName:name -> {type: 'Thing', name: name},
  thingName = spaces firstAndRest(`upper, `letterOrDigit):name -> name.join(''),
  propertyName = spaces firstAndRest(`lower, `letterOrDigit):name -> name.join(''),
  propertyValue = variableValue:x -> x |
                  stringValue:x -> x |
                  numberValue:x -> x,
  variableValue = thingName:x -> {type: 'thing', value: x},
  stringValue = "'" letterOrDigit*:x "'" -> {type: 'string', value: x.join('')},
  numberValue = digit*:x -> {type: 'number', value: x.join('')},
  text = string*:x -> x.join(''),
  thingBody = propertyDef*:props -> props,
  propertyDef = propertyName:prop spaces ":" spaces propertyValue:value '\n' -> {propName: prop, propValue: value}
}

var ModelTranslator = function() {
  var translate = function(data) {
    var code = 'var Thing = thingStore.lookup("uri:thing"); \n\n';
    code += data.map(function(thingData) {
      var label = thingData.label;
      var type = thingData.type;
      var thingCode = 'var ' + label + ' = ' + type + '.make([ \n';
      thingCode += thingData.properties.map(function(prop) {
        return '  [' + JSON.stringify(prop.propName) + ', ' + JSON.stringify(prop.propValue.value) + ']'
      }).join(', \n');
      thingCode += '\n]); \n';
      return thingCode;
    }).join('\n');
    return code;
  };
  return {translate: translate}
}

var testAdvanced = "
  Person(Thing)
    owns: Furniture
    knows: Person
    worksAt: Company
    description: 'sometext'
    someNumber: 8
  
  Mirko(Person)
    owns: Chair
    knows: Graham
  
  Graham(Person)
    owns: Table 
    
  EmptyThing
  AnotherThing
";
var parsedModel = ModelParser.matchAll(testAdvanced, 'eval');
console.log(parsedModel);
ModelTranslator().translate(parsedModel);
//ModelCompiler.matchAll(translation, 'eval');
