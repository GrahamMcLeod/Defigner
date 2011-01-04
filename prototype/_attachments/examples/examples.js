

var runExamples = function(dict) {
  // initializing some variables using the dictionary:
  var label = dict('label');
  var string = dict('string');
  var number = dict('number');
  var property = dict('property');
  var description = dict('description');
  var collection = dict('collection');
  var relationship = dict('relationship');
  
//defining some properties to use:  
  var createdAt = property.make([
    ['name', 'created_at'],
    [label, 'created At'],
    ['range', dict('date')]
  ]);
  
  var colour = property.make([
    ['name', 'colour'],
    [label, 'colour'],
    ['range', string]
  ]);
  
  var legs = property.make([
    ['name', 'legs'],
    [label, 'Legs'],
    [description, 'number of legs'],
    ['range', number]
  ]);
  
  var height = property.make([
    ['name', 'height'], 
    [label, 'height'], 
    [description, 'height in centimeters'],
    ['range', number]
  ]);
  
  //defining some things holding the properties:
  var furniture = thing.make([
    ['name', 'furniture'],
    [label, 'Furniture'],
    [createdAt, 1900],
    [colour, '']
  ]);
  
  var table = furniture.make([
    ['name', 'table'],
    [label, 'Table'],
    [colour, 'brown'],
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
    [colour, 'green'],
    [legs, 4]
  ]);
  
  var board = furniture.make([
    ['name', 'board'],
    [label, 'Board'],
    [colour, 'brown']
  ]);
  
  var house = thing.make([
    ['name', 'house'],
    [label, 'House']
  ]);
  
  //defining a relationship between House and Furniture
  var houseHasFurniture = collection.make([
    ['name', 'house_has'],
    [label, 'has'],
    ['domain', house],
    ['range', furniture]
  ]);
  
  //adding that relationship to the House prototype
  house.property(houseHasFurniture, [furniture]);
  
  var myHouse = house.make([
    ['name', 'myHouse'],
    [label, 'My House'],
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
    [label, 'Person']
  ]);
  
  var personOwns = relationship.make([
    ['name', 'person_owns'],
    [label, 'owns'],
    ['domain', person],
    ['range', thing]
  ]);
  
  var ownedByPerson = relationship.make([
    ['name', 'owned_by_person'],
    [label, 'owned by'],
    ['inverse', personOwns]
  ]);
  
  var knows = relationship.make([
    ['name', 'knows'],
    [label, 'knows'],
    ['domain', person],
    ['range', person]
  ]);
  
  var knownBy = relationship.make([
    ['name', 'known_by'],
    [label, 'known by'],
    ['inverse', knows]
  ]);
  
  var personOwnsFurniture = relationship.make([
    ['name', 'person_owns_furniture'],
    [label, 'owns'],
    ['domain', person],
    ['range', furniture]
  ]);

  var furnitureOwnedByPerson = relationship.make([
    ['name', 'furniture_owned_by_person'],
    [label, 'owned by'],
    ['inverse', personOwnsFurniture]
  ]);  
  
  person.property(personOwnsFurniture, []);
  person.property(knows, []);

  var graham = person.make([
    ['name', 'graham'],
    [label, 'Graham'],
    [personOwns, [grahamsHouse]],
    [personOwnsFurniture, [bigTable]]
  ]);
  
  var mirko = person.make([
    ['name', 'mirko'],
    [label, 'Mirko'],
    [personOwns, [myHouse]],
    [knows, [graham]]
  ]);
//$('#log').append ('<br>Data written to couch');
};


