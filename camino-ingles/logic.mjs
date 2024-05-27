// https://colorkit.co/color-palette-generator/413344-614c65-806485-936397-567d99-395e77-305662-264d4d-315c45-8a9a65/
const colors = ["#f579ff","#e975ff","#dc73ff","#cb70ff","#b56eff","#9870fe","#817cff","#87a2ff","#94caff","#96ebff"];

// Initialize Leaflet map
const map = L.map('map').setView(
    [
        43.2, // lat
        -8.4, // lng
    ],
    10 // zoom
);

const one_hour_ms = 1000 * 60 * 60;

function humanDate(d) {
    const s = d.toISOString();
    return `${s.substring(0, 10)} ${s.substring(11, 16) }`;
}

const images = [];
await fetch('images/list.txt').then(resp => resp.text()).then(data => {
    const files = data.split('\n').filter(file => file.length > 0);
    files.forEach(f => {
        const time = `${f.substring(0, 4)}-${f.substring(4, 6)}-${f.substring(6, 8)}T${f.substring(9, 11)}:${f.substring(11, 13)}:${f.substring(13, 15)}`;
        const date = new Date(time);
        date.setHours(date.getHours() - 1); // fix Spain's GMT hour difference

        images.push({
            url: `thumbs/${f}`,
            time: date.valueOf(),
        });
    });
    
});

//const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const tileUrl = 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{y}.jpeg';
L.tileLayer(tileUrl, {
    tms: true,
    attribution: '&copy; PNOA Spain'
}).addTo(map);

const markers = L.markerClusterGroup({
    //spiderfyOnMaxZoom: false,
    //showCoverageOnHover: false,
    //zoomToBoundsOnClick: false,
    //disableClusteringAtZoom: 0,
    maxClusterRadius: 20,
    //singleMarkerMode: true,
    iconCreateFunction: (cluster) => {
		return L.divIcon({
            html: `<b>${cluster.getChildCount()}</b>`,
            iconSize: [20, 20],
            className: 'leaflet-cluster'
        });
	}
});

fetch('camino_ingles.geojson')
.then(resp => resp.json())
.then(data => {
    L.geoJSON(data, {
        onEachFeature: (feature, layer) => {
            const name = feature.properties.name;

            L.geoJSON(feature, {
                color: colors.shift(),
                opacity: 0.75,
                weight: 4,
                //title: name,
                //alt: name,
                //show_on_map: true,
            }).addTo(map);

            const times = feature.properties.coordinateProperties.times.map(t => (new Date(t)).valueOf());
            const minTime = Math.min(...times) - one_hour_ms;
            const maxTime = Math.max(...times) + one_hour_ms;

            let i = images.length - 1;
            while (i >= 0) {
                const im = images[i];
                const t = im.time;

                if (t < minTime || t > maxTime) { --i; continue; }

                let bestTDiff = 10000000;
                let best;
                times.forEach((t2, j) => {
                    const tDiff = Math.abs(t - t2);
                    if (tDiff < bestTDiff) {
                        bestTDiff = tDiff;
                        best = {
                            j,
                            pos: feature.geometry.coordinates[j]
                        };
                    }
                });
                
                if (!best) { --i; continue; }

                const j = best.j;
                const props = feature.properties.coordinateProperties;
                const heart = props.heart[j];
                const time = props.times[j];
                const temp = props.atemps[j];

                const pos = best.pos;
                const img = document.createElement('img');
                img.src = im.url;
                img.style.opacity = 0;
                document.body.appendChild(img);
                img.addEventListener('load', () => {
                    const w = img.width;
                    const h = img.height;
                    const W = w * 10;
                    const H = h * 10;
                    
                    document.body.removeChild(img);
                    //const style = `width:${w}px; height:${h}px; left:-${w / 2}px; top:-${h / 2}px; position:relative`;
                    const style = `width:${w}px; height:${h}px`;

                    const icon = L.divIcon({
                        html: `<img src="${im.url}" style="${style}">`,
                        iconSize: [w, h],
                        className: 'leaflet-div-icon'
                    });

                    // https://leafletjs.com/reference.html#marker
                    const marker = L.marker([pos[1], pos[0]], { icon, title: name, alt: name });//.addTo(map);

                    markers.addLayer(marker);

                    const date = new Date(time);
                    date.setHours(date.getHours() + 2);
                    marker.bindPopup(`<img src="${im.url.replace('thumbs', 'images')}"><br><p>${temp}℃, ${heart} bpm, ${humanDate(date)}<br>${name}</p>`, {
                        maxWidth: '600px',
                        offset: L.point(-W/2, 0),
                    });
                });

                images.splice(i, 1);
                --i;
            }

            map.addLayer(markers);
        }
    });
})
.catch(error => {
    console.error('Error loading GeoJSON:', error);
});
