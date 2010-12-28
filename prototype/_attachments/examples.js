//defining a furniture prototype
var furniture = thing.make([
  ['name', 'furniture'],
  [date.make('createdAt'), undefined],
  [string.make('colour'), undefined]
]);

/*furniture.on('created', function(thing) {
  thing.property('createdAt', new Date());
});*/

//when using the property types defined in the prototype you only need to give the value,
//when defining new properties you need to make the type explicit
var legs = number.make([
  ['name', 'legs'], 
  ['description', 'number of legs']
]);

var height = number.make([
  ['name', 'height'], 
  ['description', 'height in centimeters']
]);

var table = furniture.make([
  ['name', 'table'],
  ['colour', 'brown'],
  [legs, 4],
  [height, 100]
]);

var bigTable = table.make([
  ['name', 'bigTable'],
  ['legs', [
    ['value', 6],
    ['description', 'a modified description']
  ]],
  ['height', 100]
]);

var house = thing.make([
  ['name', 'house'],
  [link.make('has'), undefined]
]);

var myHouse = house.make([
  ['name', 'myHouse'],
  ['has', bigTable]
]);

var owns = relationship.make([
  ['name', 'owns'],
  ['inverseRelationship', 'owned By']
]);

var person = thing.make([
  ['name', 'person'],
  [owns, furniture]
]);



var triples = [];
for(var uri in thingStore) {
  for(var pred in thingStore[uri]) {
    if((typeof thingStore[uri][pred] != 'function') && (thingStore[uri].hasOwnProperty(pred))) {
      triples.push([uri, pred, thingStore[uri][pred]]);    
    }
  }
}

html = '<table><tr style="font-weight: bold"><td>Subject</td><td>Predicate</td><td>Object</td></tr>';
triples.forEach(function(row) {
  html += '<tr>';
  row.forEach(function(column) {
    html += '<td>' + column + '</td>';
  });
  html += '</tr>';
});
html += '</table>';

$(function() {
  $('#log').html(html);
  thingStore.flushToCouch();
  $('#log').append ('<br>Data written to couch');
  $('#thing').append(bigTable.myHTML() + '<br><br>');
  $('#thing').append(furniture.myHTML());
});


