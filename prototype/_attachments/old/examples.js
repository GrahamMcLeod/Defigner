//defining a furniture prototype
var furniture = thing.make({
  name: 'furniture',
  createdAt: date,
  colour: string,
});

//when using the property types defined in the prototype you only need to give the value,
//when defining new properties you need to make the type explicit
var table = furniture.make({
  name: 'table',
  createdAt: '2007/10/02',
  colour: 'brown',
  legs: number.make({value: 4, description: 'number of legs'}),
  height: number.make({description: 'height in centimeters'})
});

var bigTable = table.make({
  name: 'bigTable',
  legs: {value: 6, description: 'a modified description'},
  height: 100
});



var house = thing.make({
  name: 'house',
  has: link
});

var myHouse = house.make({
  name: 'myHouse',
  has: bigTable
});

var person = thing.make({
  name: 'person',
  owns: relationship.make({value: furniture, inverseRelationship: 'owned by'})
});



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
  thingStoreToCouch ();
  $('#log').append ('<br>Data written to couch');
  $('#thing').append(bigTable.myHTML() + '<br><br>');
  $('#thing').append(furniture.myHTML());
});


