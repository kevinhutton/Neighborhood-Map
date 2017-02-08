// Make all external APIS are loaded prior to proceeding
$(document).ready(function()  {

// Make map and mapMarkers global so that they can be accessed outside of knockout.js
var map;
var mapMarkers = [];

// Initiate Google Map
// Set the center to Pleasanton,CA

function initMap() {
  console.log("Intialize Google Map")
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 37.640759, lng: -121.882039},
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
        at: '37.640759,-121.882039',
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
          var newMarkerCoordinates = {lat: latitude, lng: longitude};
          var newMarker = new google.maps.Marker({
                position: newMarkerCoordinates,
                map: map,
                clickable: true,
          });
          newMarker.setAnimation(google.maps.Animation.BOUNCE);
          var infowindow = new google.maps.InfoWindow()
          infowindow.maxWidth =  350;
          google.maps.event.addListener(newMarker, 'click', (function(newMarker,name,latitude,longitude,address) {
          return function() {
            unselectMarkers(map);
            var htmlContent =
            "<p></br>Name:</br>" +
             name + "</br>Latitude:</br>" + latitude + "</br>Longitude:</br>" + longitude + "</br>Address:</br>"
             + address + "</br>"
            infowindow.setContent(htmlContent);
            google.maps.event.addListener(infowindow,'closeclick',function(){
              newMarker.setIcon('https://www.google.com/mapfiles/marker_red.png');
            });
            infowindow.open(map,newMarker,latitude,longitude);
            newMarker.setIcon('https://www.google.com/mapfiles/marker_green.png');
          };

          })(newMarker,name,latitude,longitude,address));

          mapMarkers.push(newMarker);
          self.places.push(new Place(name,latitude,longitude,address,newMarker));

         }

      },
      error: function(data) {

        alert("Error: Unable to find local places using HERE API");

      }
    });

  }


}

// Enable Knockout.js engine
ko.applyBindings(new PlaceViewModel())
});
