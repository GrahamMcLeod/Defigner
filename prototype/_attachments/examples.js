//defining some properties to use:
var createdAt = property.make([
  ['name', 'created_at'],
  [label, 'created At'],
  ['range', date]
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
  [createdAt, undefined],
  [colour, undefined]
]);

var table = furniture.make([
  ['name', 'table'],
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

var house = thing.make([
  ['name', 'house'],
  [label, 'House']
]);

//defining a relationship between House and Furniture
var houseHasFurniture = property.make([
  ['name', 'house_has'],
  [label, 'has'],
  ['domain', house],
  ['range', furniture]
]);

//adding that relationship to the House prototype
house.property(houseHasFurniture, undefined);

var myHouse = house.make([
  ['name', 'myHouse'],
  [houseHasFurniture, bigTable]
]);

var furnitureOwnedByPerson = property.make([
  ['name', 'furniture_owned_by_person'],
  [label, 'owned by'],
  ['inverse', personOwnsFurniture]
]);

var person = thing.make([
  ['name', 'person'],
  [label, 'Person']
]);

var personOwnsFurniture = property.make([
  ['name', 'person_owns_furniture'],
  [label, 'owns'],
  ['domain', person],
  ['range', furniture]
]);

person.property(personOwnsFurniture, undefined);

var graham = person.make([
  ['name', 'graham'],
  [label, 'Graham'],
  [personOwnsFurniture, bigTable]
]);

thingStore.commit();

$(function() {
  $('#log').append ('<br>Data written to couch');
  //$('#thing').append(bigTable.myHTML() + '<br><br>');
  //$('#thing').append(furniture.myHTML());
});


