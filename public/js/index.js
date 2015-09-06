
var map;
var bounds;
var infowindows = [];
function initMap() {
	bounds = new google.maps.LatLngBounds();
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 40.7157912, lng: -73.9805548},
		zoom: 8
	});

	var add_event = function(event) {

		var infowindow = new google.maps.InfoWindow({
			content: event.info
		});
		

		var marker = new google.maps.Marker({
			position: event.location,
			map: map,
			icon: event.icon,
			title: event.title
		});

		marker.addListener('click', function() {
			infowindow.open(map, marker);
			infowindows.forEach(function(i){
				if(infowindow!=i) i.close();
			})
		});

		infowindows.push(infowindow);
		bounds.extend(marker.getPosition());
	}

	$.ajax({
		url: '/data',
		data: {},
		type: 'GET',
		error: function() {
		  console.log("error fetching data")
		},
		dataType: 'json',
		success: function(data) {
			data.events.forEach(add_event);
			map.fitBounds( bounds );
			locate_user();
		},
	});
}

function locate_user() {
	if (!navigator.geolocation) return false;
	navigator.geolocation.getCurrentPosition(function(position) {

		var marker = new google.maps.Marker({
			position: {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			},
			map: map,
			icon: "/img/geolocation.png",
			title: "You"
		});

		map.setCenter(marker.getPosition());
		map.setZoom(14);
    }, function() {
		console.log("Geolocation failed");
    });
}