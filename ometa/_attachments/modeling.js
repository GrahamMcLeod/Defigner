ometa Test <: Parser {
  eval = thingDef:x -> x,
  thingDef = thingHead:head  '\n' thingBody:body -> ('var ' + head.name + ' = ' + JSON.stringify(body)),
  thingHead = "thing" spaces thingName:x -> {parent: '', name: x},
  thingName = spaces firstAndRest(`upper, `letterOrDigit):name -> name.join(''),
  propertyName = spaces firstAndRest(`lower, `letterOrDigit):name -> name.join(''),
  propertyValue = letterOrDigit*:x -> x.join(''),
  text = string*:x -> x.join(''),
  thingBody = propertyDef*:props -> function() {var propObj = {}; props.forEach(function(each) {propObj[each.property] = each.value}); return propObj} (),
  propertyDef = propertyName:prop spaces ":" spaces propertyValue:value '\n' -> {property: prop, value: value}
}

var test = '
  thing Person
    owns: Furniture
    knows: Person
    worksAt: Company
';
Test.matchAll(test, 'eval')