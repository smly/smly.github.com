// https://obfuscator.io/
const url_prefix = 'http://192.168.100.4:8000/data';
var cities = {};
var map = L.map('mapid', {zoomControl: false})
var origin = 7;
var chiper = 101 - origin * origin;

function updatePrefJson(pref_code) {
  const url = url_prefix + '/' + pref_code + '/pref.json';

  var promiseResult = fetch(url)
  .then(function(response) {
    return response.json();
  })
  .then(function(jsonObj) {
    cities[pref_code] = jsonObj[pref_code];
    return true;
  });

  return promiseResult;
}

function loadCityData(pref_code, city) {
  var result = updatePrefJson(pref_code);

  result.then(function(r) {
    var city_info = cities[pref_code][city];
    const city_name = city_info['name'];
    const url = url_prefix + '/' + pref_code + '/' + city;
    const loc_x = city_info['loc_x'];
    const loc_y = city_info['loc_y'];
    const bounds = city_info['bounds'];

    getDefaultJson(url, loc_x, loc_y, bounds, city_name);
  });
}

function reloadCityData(pref_code, city) {
  map.off();
  map.remove();
  map = L.map('mapid', {zoomControl: false})

  var container = L.DomUtil.get('map');
  if (container != null) {
    container._leaflet_id = null;
    container._leaflet_pos = null;
  }

  loadCityData(pref_code, city);
}

function getColor(d) {
    return d > 30000 ? '#49006a' :
           d > 20000 ? '#7a0177' :
           d > 15000 ? '#ae017e' :
           d > 10000 ? '#dd3497' :
           d >  7000 ? '#f768a1' :
           d >  4000 ? '#fa9fb5' :
           d >  2000 ? '#fcc5c0' :
                       '#fde0dd';
}

function style(feature) {
    var density = (feature.properties.JINKO / feature.properties.AREA * 1000000);
    return {
            fillColor: getColor(density),
            weight: 0.5,
            opacity: 1,
            color: 'black',
            fillOpacity: 0.7
        };
}

function onEachFeature(feature, layer) {
  if (feature.properties && feature.properties.JINKO && feature.properties.S_NAME) {
    // layer.bindPopup(feature.properties.JINKO);
    layer.bindTooltip(
      "市区町村: " + feature.properties.CITY_NAME.toString() + "<br />" +
      "小地域名: " + feature.properties.S_NAME.toString() + "<br />" +
      "人口: " + feature.properties.JINKO.toString() + "<br />" +
      "世帯数: " + feature.properties.SETAI.toString() + "<br />" +
      "面積: " + feature.properties.AREA.toString() + "<br />" +
      "人口密度: " + (feature.properties.JINKO / feature.properties.AREA * 1000000).toString());
  }
}

function getDefaultJson(url, loc_x, loc_y, bounds, city_name) {
  fetch(url)
  .then(function(response) {
    return response.arrayBuffer();
  })
  .then(function(arrayBuffer) {
    var buf = new Uint8Array(arrayBuffer);
    for (var i=0; i<buf.length; ++i) {
      buf[i] = buf[i] ^ chiper;
    }
    const result = pako.inflate(arrayBuffer, { to: 'string' });
    return JSON.parse(result);
  })
  .then(function(json) {
    map.setView([loc_x, loc_y], 5);
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();

	L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    }).addTo(map);

    var featureLayer = L.geoJSON(json, {
      style: style,
      onEachFeature: onEachFeature
    }).addTo(map);

    var info = L.control();
    info.onAdd = function (map) {
      if (this._div != null) {
        L.DomUtil.remove(this._div);
      }
      this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
      this.update();
      return this._div;
    };
    info.update = function (props) {
        this._div.innerHTML = '<h3>' + city_name + '</h3>';
    }
    info.addTo(map);

    var legend = L.control({position: 'bottomright'});
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 2000, 4000, 7000, 10000, 15000, 20000, 30000],
            labels = [];
        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
        return div;
    };
    legend.addTo(map);

    map.fitBounds(bounds);
  });
}

window.addEventListener('load', function() {
  var city = 103;
  loadCityData('13', city);

  fetch('./data/rows.json')
  .then(function(response) {
    return response.json();
  })
  .then(function(json) {
      for (var i = 0; i < json.length; i++) {
        json[i]['city_name'] = (
            '<a href="#" onclick="reloadCityData(\'' +
            json[i]['pref_code'] + '\', ' +
            json[i]['city_id'] + ');">' +
            json[i]['city_name'] + '</a>');
    }
    var ft = FooTable.init('#load-table', {
      "columns": [
        {name: "pref_name", title: "都道府県"},
        {name: "city_name", title: "市区町村"},
        {name: "jinko", title: "人口"},
        {name: "area", title: "面積"},
        {name: "density", title: "人口密度"},
      ],
      "rows": json,
    });
  });
});
