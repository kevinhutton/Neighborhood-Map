
$(document).ready(function()  {

var map;
var mapMarkers = [];

//Initiate Google Map

function initMap() {
  console.log("Intialize Google Map")
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 37.640759, lng: -121.882039},
    zoom: 8,
    zoomControl: true,
    Labels: false,
    styles: [
    {
      "featureType": "poi",
      "stylers": [
        { "visibility": "off" }
      ]
    }
  ]
  });
  return map;


}

// Create New Google Map Marker

function newMarker(latitude,longitude,map) {
    console.log("Add New Marker on Map");
    var newMarkerCoordinates = {lat: latitude, lng: longitude};
    var marker = new google.maps.Marker({
          position: newMarkerCoordinates,
          map: map,
        });
    return marker;
}


function setMapCenter(latitude,longitude,map) {
    console.log("Changing center of map");
    var newMarkerCoordinates = {lat: latitude, lng: longitude};
    map.setCenter(newMarkerCoordinates)
}

function clearMarkers(map) {

  for (var i = 0; i < mapMarkers.length; i++) {
          mapMarkers[i].setMap(null);
  }


}


// Knockout.js Model

function Place(name,latitude,longitude,marker){
  var self = this;
  self.name = name;
  self.latitude = latitude;
  self.longitude = longitude;
  self.marker = marker;
}

// Knockout.js ModelView(Controller)

function PlaceViewModel(){
  var self = this;
  self.map = initMap();
  self.searchTerm = ko.observable("");
  self.currentPlace = ko.observable("");
  self.places = ko.observableArray([]);

  // The current item will be passed as the first parameter, so we know which place to remove

  self.showInformation = function(place) {
    self.currentPlace(place) ;
    self.map.setCenter(place.marker.getPosition());
    place.marker.setAnimation(google.maps.Animation.BOUNCE);
    new google.maps.event.trigger( place.marker, 'click' );

  }

  self.addPlace = function (data) {


    var placeName = data.searchTerm();
    clearMarkers(self.map)
    self.places([]);
    console.log("Gather nearby places USING HERE Places API ")
    $.ajax({
      url: 'https://places.demo.api.here.com/places/v1/discover/search',
      type: 'GET',
      data: {
        at: '37.640759,-121.882039',
        q: placeName,
        app_id: 'XMbDU0K64PNaYcceIteX',
        app_code: 'YXDek3vsGBTtvxC8dJUqBQ'
      },
      beforeSend: function(xhr){
        xhr.setRequestHeader('Accept', 'application/json');
      },
      success: function (data) {
        var places = data.results.items ;
        for (i in places) {
          var name = places[i].title;
          var latitude = places[i].position[0];
          var longitude = places[i].position[1];

          console.log("Add New Marker on Map");
          var newMarkerCoordinates = {lat: latitude, lng: longitude};
          var newMarker = new google.maps.Marker({
                position: newMarkerCoordinates,
                map: map,
                clickable: true,

          });
          newMarker.setAnimation(google.maps.Animation.BOUNCE);
          var infowindow = new google.maps.InfoWindow();
          google.maps.event.addListener(newMarker, 'click', (function(newMarker,name,latitude,longitude) {
          return function() {
            console.log("Click event triggered on marker");
            var htmlContent = "<p>Name: " + name + "</br>" + "Latitude:" + latitude + "</br>" + "Longitude" + longitude;
            infowindow.setContent(htmlContent);
            infowindow.open(map,newMarker,latitude,longitude);
          };

          })(newMarker,name,latitude,longitude));

          mapMarkers.push(newMarker);
          self.places.push(new Place(name,latitude,longitude,newMarker));


         }


      }
    });

  }


}
console.log
// Enable Knockout.js engine
ko.applyBindings(new PlaceViewModel())
});
