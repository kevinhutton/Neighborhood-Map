// Make map and mapMarkers global so that they can be accessed outside of knockout model

var map;
var mapMarkers = [];

// Initiate Google Map
// Set the center to Berkeley,CA

function startApp() {

    console.log("Intialize Google Map")
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 37.87008,
            lng: -122.26798
        },
        zoom: 15,
        styles: [{
            "featureType": "poi",
            "stylers": [{
                "visibility": "off"
            }]
        }]
    });
    map.addListener('click', function(map) {
        unselectMarkers(map);
    });
    this.map = map;
    ko.applyBindings(new PlaceViewModel());
}

// Create New Google Map Marker

function newMarker(latitude, longitude, map) {

    var newMarkerCoordinates = {
        lat: latitude,
        lng: longitude
    };
    var marker = new google.maps.Marker({
        position: newMarkerCoordinates,
        map: map,
    });
    return marker;
}

// Unselect all current markers , close open infowindow(s)
function unselectMarkers(map) {

    for (var i = 0; i < mapMarkers.length; i++) {
        mapMarkers[i].setIcon('https://www.google.com/mapfiles/marker.png');
        mapMarkers[i].infowindow.close();
    }
}

// Display pop up if google maps fails to load
function googleMapsLoadingError() {
    alert("Unable to load google maps engine!");
}


// Knockout.js Model

function Place(name, latitude, longitude, address, marker) {

    var self = this;
    self.name = name;
    self.latitude = latitude;
    self.longitude = longitude;
    self.address = address;
    self.marker = marker;
}

// Knockout.js ModelView

function PlaceViewModel() {

    var self = this;
    self.searchCriteria = ko.observable("");
    self.currentPlace = ko.observable("");
    self.places = ko.observableArray([]);
    self.filteredPlaces = ko.computed(function() {
        var filter = this.searchCriteria().toLowerCase();
        //If empty , return all places
        if (!filter.trim()) {
            // Make sure all markers are visible
            ko.utils.arrayFilter(this.places(), function(place) {
                place.marker.setVisible(true);
            });
            return this.places();
        } else {
            //Return all places which contain the searchCriteria as a substring
            return ko.utils.arrayFilter(this.places(), function(place) {
                place.marker.setVisible(false);
                if (place.name.toLowerCase().includes(filter)) {
                    //Make the map marker visible
                    place.marker.setVisible(true);
                    return place;
                }

            });
        }
    }, self);

    //Display infowindow , turn marker color to green , center map on Place coordinates

    self.displayPlaceInformation = function(place) {

        self.currentPlace(place);
        self.currentPlace().marker.setIcon('https://www.google.com/mapfiles/marker_green.png');
        map.setCenter(place.marker.getPosition());
        google.maps.event.trigger(place.marker, 'click');

    }

    // Add a new place to the map

    self.addPlace = function(name, latitude, longitude, address) {

        // Create google maps marker
        var newMarkerCoordinates = {
            lat: latitude,
            lng: longitude
        };
        var newMarker = new google.maps.Marker({
            position: newMarkerCoordinates,
            map: map,
            clickable: true,
        });


        // Create Infowindow
        newMarker.infowindow = new google.maps.InfoWindow();


        // Display Infowindow on marker click , and change marker color to green
        google.maps.event.addListener(newMarker, 'click', (function(newMarker, name, latitude, longitude, address) {
            return function() {
                // Close any open infowindows , change marker color back to red
                unselectMarkers(map);
                var htmlContent =
                    "<p></br>Name:</br>" +
                    name + "</br>Latitude:</br>" + latitude + "</br>Longitude:</br>" + longitude + "</br>Address:</br>" +
                    address;
                newMarker.infowindow.setContent(htmlContent);
                google.maps.event.addListener(newMarker.infowindow, 'closeclick', function() {
                    newMarker.setIcon('https://www.google.com/mapfiles/marker.png');
                });
                // Open infowindow
                newMarker.infowindow.open(map, newMarker, latitude, longitude);
                // Set marker to green since it is selected
                newMarker.setIcon('https://www.google.com/mapfiles/marker_green.png');
                // Gather weather information dynamically from Dark Sky API
                // Use crossorigin to avoid CORS errors - JSONP would also work here but error handling for JSONP is bad
                var weatherAPIUrl = "https://crossorigin.me/https://api.darksky.net/forecast/ac53909bbdc6b3c26f9df01c692ce401/" + latitude + "," + longitude;
                var weatherInfoHTML;
                req = $.ajax({
                    url: weatherAPIUrl,
                    timeout: 0,

                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('Accept', 'application/json');
                    },
                    success: function(data) {
                        var weatherSummary = data.currently.summary;
                        var temperature = data.currently.temperature;
                        weatherInfoHTML = "</br>Current Weather:</br>" + weatherSummary + "</br>Current Temperature:</br>" +
                            temperature;
                        newMarker.infowindow.setContent(newMarker.infowindow.getContent() + weatherInfoHTML);
                    },
                    error: function(data) {

                        console.log("Error: Unable to find local places using DarkSky API");
                        weatherInfoHTML = "</br>Current Weather:</br>Unable to determine current weather" +
                            "</br>Current Temperature:</br>Unable to determine current temperature";
                        newMarker.infowindow.setContent(newMarker.infowindow.getContent() + weatherInfoHTML);

                    }
                });
            };

        })(newMarker, name, latitude, longitude, address));

        // Add new marker to map and model
        mapMarkers.push(newMarker);
        self.places.push(new Place(name, latitude, longitude, address, newMarker));

    }

    // Set default places , call function immediately
    // Gather 20 random places around berkeley dynamically using HERE
    // If HERE API is not available , use default places instead
    self.setDefaultPlaces = function() {

        $.ajax({
            url: 'https://places.demo.api.here.com/places/v1/discover/around',
            type: 'GET',
            data: {
                at: '37.87008,-122.26798;r=10500',
                app_id: 'XMbDU0K64PNaYcceIteX',
                app_code: 'YXDek3vsGBTtvxC8dJUqBQ',
                size: 20,
            },
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Accept', 'application/json');
            },
            success: function(data) {
                var results = data.results.items;
                for (i in results) {
                    var name = results[i].title;
                    var latitude = results[i].position[0];
                    var longitude = results[i].position[1];
                    var address = results[i].vicinity;
                    self.addPlace(name, latitude, longitude, address);

                }

            },
            error: function(data) {

                alert("We were unable to find local places using the HERE API , showing some default locations instead");
                self.addPlace("Chez Panisse", 37.87954, -122.26916, "1517 Shattuck Ave Berkeley, CA 94709");
                self.addPlace("Barney's Gourmet Hamburgers", 37.89108, -122.28487, "1591 Solano Ave Berkeley, CA 94707");
                self.addPlace("Greek Theater", 37.874073, -122.25554, "2001 Gayley Rd Berkeley, CA 94720");
                self.addPlace("University of California-Berkeley", 37.86948, -122.25929, "101 Sproul Hall Berkeley, CA 94720");
                self.addPlace("Amoeba Music", 37.86581, -122.25859, "2455 Telegraph Ave Berkeley, CA 94704");

            }
        });

    }();

}

// Start Knockout.js engine
