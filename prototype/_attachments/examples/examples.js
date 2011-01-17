

var runExamples = function(dict) {
  // initializing some variables using the dictionary:
  var thing = dict('thing');
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
//defining some properties to use:  
  var createdAt = property.make([
    ['name', 'created_at'],
    [label, 'created At'],
    [range, dict('date')]
  ]);
  
  var colour = property.make([
    ['name', 'colour'],
    [label, 'colour'],
    [range, string]
  ]);

  var colours = collection.make([
    ['name', 'colours'],
    [label, 'colours'],
    [range, string]
  ]);
  
  var legs = property.make([
    ['name', 'legs'],
    [label, 'Legs'],
    [description, 'number of legs'],
    [range, number]
  ]);
  
  var lookupValue = thing.make([
    ['name', 'lookup'],
    [label, 'Lookup Value']
  ])
  
  var personHeightValue = lookupValue.make([
    ['name', 'person-height-value'],
    [label, 'Person Height']
  ]);
  
  var shortPerson = personHeightValue.make([
    ['name', 'short'],
    [label, 'short']
  ]);
  
  var tallPerson = personHeightValue.make([
    ['name', 'tall'],
    [label, 'tall']
  ]);

  var personHeight = property.make([
    ['name', 'personheight'], 
    [label, 'height'], 
    [description, 'height in centimeters'],
    [range, personHeightValue]
  ]);
  
  var height = property.make([
    ['name', 'height'], 
    [label, 'height'], 
    [description, 'height in centimeters'],
    [range, number]
  ]);
  
  //defining some things holding the properties:
  var furniture = thing.make([
    ['name', 'furniture'],
    [label, 'Furniture'],
    [createdAt, 1900],
    [colours, []]
  ]);
  
  var table = furniture.make([
    ['name', 'table'],
    [label, 'Table'],
    [colours, ['brown']],
    [legs, 4],
    [height, 100]
  ]);
  
  var bigTable = table.make([
    ['name', 'big_table'],
    [label, 'Big Table'],
    [legs, 6],
    [height, 100]
  ]);
  
  var smallTable = table.make([
    ['name', 'small_table'],
    [label, 'Small Table'],
    [legs, 4],
    [height, 100]
  ]);

  var chair = furniture.make([
    ['name', 'chair'],
    [label, 'Chair'],
    [colours, ['green', 'brown']],
    [legs, 4]
  ]);
  
  var board = furniture.make([
    ['name', 'board'],
    [label, 'Board'],
    [colours, ['brown', 'yellow', 'blue']]
  ]);
  
  var house = thing.make([
    ['name', 'house'],
    [label, 'House']
  ]);
  
  var smallHouse = house.make([
    ['name', 'small_house'],
    [label, 'Small House']
  ]);
  
  var bigHouse = house.make([
    ['name', 'big_house'],
    [label, 'Big House']
  ]);
  
  //defining a relationship between House and Furniture
  var houseHasFurniture = collection.make([
    ['name', 'house_has'],
    [label, 'has'],
    [domain, house],
    [range, furniture]
  ]);
  
  //adding that relationship to the House prototype
  house.property(houseHasFurniture, [furniture]);
  
  var myHouse = smallHouse.make([
    ['name', 'myHouse'],
    [label, 'My House'],
    [houseHasFurniture, [table]]
  ]);
  
  var myHouse = bigHouse.make([
    ['name', 'a_big_house'],
    [label, 'A Big House'],
    [houseHasFurniture, [table]]
  ]);  

  var grahamsHouse = house.make([
    ['name', 'grahams_house'],
    [label, 'Grahams House'],
    [houseHasFurniture, [bigTable, chair, board]]
  ]);
  
 // var person = thingStore.lookup("uri:thing/person");
  
  
  var person = thing.make([
    ['name', 'person'],
    [label, 'Person'],
    [personHeight, personHeightValue]
  ]);
  
  var personOwns = relationship.make([
    ['name', 'person_owns'],
    [label, 'owns'],
    [domain, person],
    [range, thing]
  ]);
  
  var ownedByPerson = relationship.make([
    ['name', 'owned_by_person'],
    [label, 'owned by'],
    [inverse, [personOwns]]
  ]);
  
  var knows = relationship.make([
    ['name', 'knows'],
    [label, 'knows'],
    [domain, person],
    [range, person]
  ]);
  
  var knownBy = relationship.make([
    ['name', 'known_by'],
    [label, 'known by'],
    [inverse, [knows]]
  ]); 
  
  person.property(knows, [person]);

  var graham = person.make([
    ['name', 'graham'],
    [label, 'Graham'],
    [personOwns, [grahamsHouse, bigTable]]
  ]);
  
  var mirko = person.make([
    ['name', 'mirko'],
    [label, 'Mirko'],
    [personOwns, [myHouse, smallTable]],
    [knows, [graham]]
  ]);
  
  var company = thing.make([
    ['name', 'company'],
    [label, 'Company']
  ]);
  company.property('isAPrototype', true);
};


