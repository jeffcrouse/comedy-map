
var map;
var bounds;
var infowindows = [];
function initMap() {
	bounds = new google.maps.LatLngBounds();
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 40.7157912, lng: -73.9805548},
		zoom: 8
	});

	// var d = new Date();
	// var url = 'http://comedy-map.herokuapp.com/feed.kml?t='+d.getTime();
	// var layer = new google.maps.KmlLayer({ url: url });
	// layer.setMap(map);

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
		},
	});
}