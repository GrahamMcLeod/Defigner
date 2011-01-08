ometa Test <: Parser {
  eval = thingDef:x -> x,
  thingDef = thingHead:head  '\n' thingBody:body -> {body.label = head.name; body},
  thingHead = "thing" spaces thingName:x -> {parent: '', name: x},
  thingName = spaces firstAndRest(`upper, `letterOrDigit):name -> name.join(''),
  propertyName = spaces firstAndRest(`lower, `letterOrDigit):name -> name.join(''),
  propertyValue = variableValue:x -> x |
                  stringValue:x -> x |
                  numberValue:x -> x,
  variableValue = thingName:x -> {type: 'thing', value: x},
  stringValue = "'" letterOrDigit*:x "'" -> {type: 'string', value: x.join('')},
  numberValue = digit*:x -> {type: 'number', value: x.join('')},
  text = string*:x -> x.join(''),
  thingBody = propertyDef*:props -> {var propObj = {}; props.forEach(function(each) {propObj[each.property] = each.propValue}); propObj},
  propertyDef = propertyName:prop spaces ":" spaces propertyValue:value '\n' -> {property: prop, propValue: value}
}

var test = "
  thing Person
    owns: Furniture
    knows: Person
    worksAt: Company
    description: 'sometext'
    someNumber: 8
";

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
";
var translation = Test.matchAll(test, 'eval');
JSON.stringify(translation);