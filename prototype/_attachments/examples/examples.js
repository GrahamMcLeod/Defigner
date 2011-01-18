

var runExamples = function(dict) {
  // initializing some variables using the dictionary:
  var thing = dict('thing');
  var type = dict('type');
  var label = dict('label');
  var string = dict('string');
  var number = dict('number');
  var property = dict('property');
  var description = dict('description');
  var collection = dict('collection');
  var relationship = dict('relationship');
  var range = dict('range');
  var domain = dict('domain');
  var inverse = dict('inverse');
  var hasProperties = dict('hasProperties');
  
//defining some properties to use:  
  var createdAt = property.item('createdAt', [
    [label, 'created At'],
    [domain, thing],
    [range, dict('date')]
  ]);
  
  var colour = property.item('colour', [
    [label, 'colour'],
    [domain, thing],
    [range, string]
  ]);

  var colours = collection.item('colours', [
    [label, 'colours'],
    [domain, thing],
    [range, string]
  ]);
  
  var legs = property.item('legs', [
    [label, 'Legs'],
    [description, 'number of legs'],
    [domain, thing],
    [range, number]
  ]);
  
  var lookupValue = type.item('lookup', [
    [label, 'Lookup Value']
  ])
  
  var personHeightValue = lookupValue.subType('person-height-value', [
    [label, 'Person Height']
  ]);
  
  var shortPerson = personHeightValue.item('short', [
    [label, 'short']
  ]);
  
  var tallPerson = personHeightValue.item('tall', [
    [label, 'tall']
  ]);

  var personHeight = property.item('person-height', [
    [label, 'height'], 
    [description, 'height in centimeters'],
    [domain, thing],
    [range, personHeightValue]
  ]);
  
  var height = property.item('height', [
    [label, 'height'], 
    [description, 'height in centimeters'],
    [domain, thing],
    [range, number]
  ]);
  
  //defining some things holding the properties:
  var furniture = type.item('furniture', [
    [label, 'Furniture'],
    [hasProperties, [
      createdAt,
      colours
    ]]
  ]);
  
  var table = furniture.subType('table', [
    [label, 'Table'],
    [hasProperties, [
      label,
      colours,
      legs,
      height
    ]]
  ]);
  
  var bigTable = table.subType('big_table', [
    [label, 'Big Table']
  ]);
  
  var smallTable = table.subType('small_table', [
    [label, 'Small Table']
  ]);

  var chair = furniture.item('chair', [
    [label, 'Chair'],
    [colours, ['green', 'brown']],
    [legs, 4]
  ]);
  
  var board = furniture.item('board', [
    [label, 'Board'],
    [colours, ['brown', 'yellow', 'blue']]
  ]);
  
  var house = type.item('house', [
    [label, 'House']
  ]);
  
  var smallHouse = house.subType('small-house', [
    [label, 'Small House']
  ]);
  
  var bigHouse = house.subType('big-house', [
    [label, 'Big House']
  ]);
  
  //defining a relationship between House and Furniture
  var houseHasFurniture = collection.item('house-has', [
    [label, 'has'],
    [domain, house],
    [range, furniture]
  ]);
  
  //adding that relationship to the House prototype
  house.property(hasProperties, [houseHasFurniture]);
  
  var myHouse = smallHouse.item('myHouse', [
    [label, 'My House'],
    [houseHasFurniture, [table]]
  ]);
  
  var aBigHouse = bigHouse.item('a-big-house', [
    [label, 'A Big House'],
    [houseHasFurniture, [table]]
  ]);  

  var grahamsHouse = house.item('grahams-house', [
    [label, 'Grahams\' House'],
    [houseHasFurniture, [bigTable, chair, board]]
  ]);  
  
  var person = type.item('person', [
    [label, 'Person']
  ]);
  
  var personOwns = relationship.item('person-owns', [
    [label, 'owns'],
    [domain, person],
    [range, thing]
  ]);
  
  var ownedByPerson = relationship.item('owned-by-person', [
    [label, 'owned by'],
    [inverse, [personOwns]],
    [domain, thing],
    [range, person]
  ]);
  
  var knows = relationship.item('knows', [
    [label, 'knows'],
    [domain, person],
    [range, person]
  ]);
  
  var knownBy = relationship.item('known-by', [
    [label, 'known by'],
    [inverse, [knows]],
    [domain, person],
    [range, person]
  ]); 
  
  person.property(hasProperties, [knows, personOwns, personHeight]);

  var graham = person.item('graham', [
    [label, 'Graham'],
    [personOwns, [grahamsHouse, bigTable]]
  ]);
  
  var mirko = person.item('mirko', [
    [label, 'Mirko'],
    [personOwns, [myHouse, smallTable]],
    [knows, [graham]]
  ]);
  
  var company = type.item('company', [
    [label, 'Company']
  ]);
};


