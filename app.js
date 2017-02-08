// Make sure DOM is loaded prior to proceeding
$(document).ready(function()  {

// Make map and mapMarkers global so that they can be accessed outside of knockout model
var map;
var mapMarkers = [];

// Initiate Google Map
// Set the center to Berkeley,CA

function initMap() {
  console.log("Intialize Google Map")
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 37.87008, lng: -122.26798},
    zoom: 10,
    styles: [
    {
      "featureType": "poi",
      "stylers": [
        { "visibility": "off" }
      ]
    }
  ]
  });
  map.addListener('click', function(map) {
    unselectMarkers(map);
  });

  return map;

}

// Create New Google Map Marker

function newMarker(latitude,longitude,map) {
    var newMarkerCoordinates = {lat: latitude, lng: longitude};
    var marker = new google.maps.Marker({
          position: newMarkerCoordinates,
          map: map,
        });
    return marker;
}

function clearMarkers(map) {

  for (var i = 0; i < mapMarkers.length; i++) {
          mapMarkers[i].setMap(null);
  }

}
function unselectMarkers(map) {

  for (var i = 0; i < mapMarkers.length; i++) {
          mapMarkers[i].setIcon('https://www.google.com/mapfiles/marker.png');
          mapMarkers[i].infowindow.close();
  }


}

function googleMapsLoadingError() {

alert("Unable to load google maps engine!");

}


// Knockout.js Model

function Place(name,latitude,longitude,address,marker){
  var self = this;
  self.name = name;
  self.latitude = latitude;
  self.longitude = longitude;
  self.address = address;
  self.marker = marker;
}

// Knockout.js ModelView(Controller)

function PlaceViewModel(){
  var self = this;
  self.map = initMap();
  self.searchTerm = ko.observable("");
  self.currentPlace = ko.observable("");
  self.places = ko.observableArray([]);

  self.displayPlaceInformation = function(place) {

    self.currentPlace(place) ;
    self.currentPlace().marker.setIcon('https://www.google.com/mapfiles/marker_green.png');
    self.map.setCenter(place.marker.getPosition());
    new google.maps.event.trigger( place.marker, 'click' );

  }

  self.retrievePlaces = function (data) {


    var placeName = data.searchTerm();
    clearMarkers(self.map)
    self.places([]);
    self.map.setZoom(12);
    console.log("Gather nearby places USING HERE Places API ")
    $.ajax({
      url: 'https://places.demo.api.here.com/places/v1/discover/search',
      type: 'GET',
      data: {
        at: '37.87008,-122.26798',
        q: placeName,
        app_id: 'XMbDU0K64PNaYcceIteX',
        app_code: 'YXDek3vsGBTtvxC8dJUqBQ'
      },
      beforeSend: function(xhr){
        xhr.setRequestHeader('Accept', 'application/json');
      },
      success: function (data) {
        var results = data.results.items ;
        for (i in results) {
          var name = results[i].title;
          var latitude = results[i].position[0];
          var longitude = results[i].position[1];
          var address = results[i].vicinity;
          self.addPlace(name,latitude,longitude,address);

         }

      },
      error: function(data) {

        alert("Error: Unable to find local places using HERE API");

      }
    });




  }

  //Add a new place to the map

  self.addPlace = function(name,latitude,longitude,address) {

  var newMarkerCoordinates = {lat: latitude, lng: longitude};
  var newMarker = new google.maps.Marker({
        position: newMarkerCoordinates,
        map: map,
        clickable: true,
  });
  newMarker.setAnimation(google.maps.Animation.BOUNCE);
  newMarker.infowindow = new google.maps.InfoWindow()
  newMarker.infowindow.maxWidth =  350;
  google.maps.event.addListener(newMarker, 'click', (function(newMarker,name,latitude,longitude,address) {
    return function()
     {
        unselectMarkers(map);
        var htmlContent =
        "<p></br>Name:</br>" +
         name + "</br>Latitude:</br>" + latitude + "</br>Longitude:</br>" + longitude + "</br>Address:</br>"
         + address + "</br>"
        newMarker.infowindow.setContent(htmlContent);
        google.maps.event.addListener(newMarker.infowindow,'closeclick',function(){
          newMarker.setIcon('https://www.google.com/mapfiles/marker.png');
        });
        newMarker.infowindow.open(map,newMarker,latitude,longitude);
        newMarker.setIcon('https://www.google.com/mapfiles/marker_green.png');
      };

  })(newMarker,name,latitude,longitude,address));

  mapMarkers.push(newMarker);
  self.places.push(new Place(name,latitude,longitude,address,newMarker));

  }

  // Set default places , call function immediately
  self.setDefaultPlaces = function() {
    console.log("This gets called");
    self.addPlace("Chez Panisse",37.87954,-122.26916,"1517 Shattuck Ave Berkeley, CA 94709");
    self.addPlace("Barney's Gourmet Hamburgers",37.89108,-122.28487,"1591 Solano Ave Berkeley, CA 94707");
    self.addPlace("Greek Theater",37.874073,-122.25554,"2001 Gayley Rd Berkeley, CA 94720");
    self.addPlace("University of California-Berkeley",37.86948,-122.25929,"101 Sproul Hall Berkeley, CA 94720");
    self.addPlace("Amoeba Music",37.86581,-122.25859,"2455 Telegraph Ave Berkeley, CA 94704");

  }();


}

// Start Knockout.js engine

ko.applyBindings(new PlaceViewModel());
});

