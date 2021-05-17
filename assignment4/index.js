const map = L.map("map", {trackResize:true}).setView([-37.77099715524306, 175.26448968099433], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var markers = L.markerClusterGroup({
	// spiderfyOnMaxZoom: false,
	showCoverageOnHover: false,
    zoomToBoundsOnClick: false,
    iconCreateFunction: function(cluster) {
        const marker = cluster.getAllChildMarkers()[0];
		return L.divIcon({ html: `
<div class="photo-marker" style="background-image:url('${marker.url}'); ">
    <span class="photo-marker-count">${cluster.getChildCount()}</span>
</div>
<div class="photo-marker-tip-container">
    <div class="photo-marker-tip"></div>
</div>`, iconAnchor:[22, 50]});
	}
});
const popup = L.marker().setZIndexOffset(999);
let popupElement;
function initPopupElement(){
    popupElement = document.querySelector('#info');
    popupElement.isOpen = false;
    popupElement.querySelector('.photo-prev').addEventListener('click', function (event) {
        if(element.markers){
            const markers = element.markers;
            const index = (element.index - 1 + markers.length) % markers.length;
            const marker = markers[index]
            const photo = marker.photo;
            const latlng = marker.latlng;
            popup.setLatLng(latlng)
            popupImage({latlng, marker, photo, markers, index});
        }
    });

    popupElement.querySelector('.photo-next').addEventListener('click', function (event) {
        if(element.markers){
            const markers = element.markers;
            const index = (element.index + 1 + markers.length) % markers.length;
            const marker = markers[index];
            const photo = marker.photo;
            const latlng = marker.latlng;
            popup.setLatLng(latlng)
            popupImage({latlng, marker, photo, markers, index});
        }
    });

    popupElement.querySelector('.info-close').addEventListener('click', function (event) {
        popupElement.style.display = 'none';
        map.invalidateSize(true);
        popupElement.isOpen = false;
        popup.remove()
    })
    
}
initPopupElement()
function popupImage({latlng, marker, photo, markers, index}){
    
    popupElement.style.display = 'block'
    element = popupElement
    
    element.querySelector('.popup-photo').style.backgroundImage = `url('${marker.url.replace(/=(w\d+-)?h\d+(-pd)?/, '=h300')}')`
    element.querySelector('.photo-title').textContent = photo.title;
    element.querySelector('.photo-author-icon').src = photo.authorIcon;
    element.querySelector('.photo-author-name').textContent = photo.authorName;
    element.querySelector('.photo-time').textContent = new Date(photo.time).toLocaleString();
    if(markers && markers.length>1){
        element.querySelector('.photo-prev').style.visibility = 'visible';
        element.querySelector('.photo-next').style.visibility = 'visible';
        element.querySelector('.photo-index').textContent = `${index + 1}/${markers.length}`;
    }
    else{
        element.querySelector('.photo-prev').style.visibility = 'hidden';
        element.querySelector('.photo-next').style.visibility = 'hidden';
        element.querySelector('.photo-index').textContent = ""
    }
    
    element.markers = markers;
    element.index = index;
    element.isOpen = true;
    
    popup.setLatLng(latlng).addTo(map);
}


(async () =>{
    const res = await fetch ('./photos.json');
    const photos = await res.json()
    for(const photo of photos){
        
        const url = photo.url.replace(/=(w\d+-)?h\d+(-pd)?/, '=h44')
        const marker = L.marker(photo.latlng, {title:photo.title, alt:photo.title, icon:L.divIcon({ html: `
        <div class="photo-marker" style="background-image:url('${url}');">
        </div>
        <div class="photo-marker-tip-container">
            <div class="photo-marker-tip"></div>
        </div>`, iconAnchor:[22, 50]})});
        marker.url = url;
        marker.latlng = photo.latlng;
        marker.photo = photo;
        markers.addLayer(marker);
    }
    markers.on('click', function (a) {
        const marker = a.layer;
        const photo = marker.photo;
        const latlng = marker.latlng;
        popupImage({latlng, marker, photo, markers:null, index: 0});
    });
    
    markers.on('clusterclick', function (a) {
        // a.layer is actually a cluster

        let className = a.originalEvent.srcElement.className;
        if(className === 'photo-marker-count'){
            a.layer.zoomToBounds({padding: [20, 20]});
        }
        {
            const markerGroup = a.layer;
            const markers = a.layer.getAllChildMarkers();
            const marker = markers[0]
            const photo = marker.photo;
            const latlng = marker.latlng
            //initPopupElement();
            popupImage({latlng, marker, photo, markers, index: 0});
        }
        //console.log('cluster ' + a.layer.getAllChildMarkers().length);
    });
    map.addLayer(markers);



    const Years = {interval :(p) => d3.timeYear.floor(p.time), timeFormat: d3.timeFormat("%Y")}
    const Months = {interval : (p) => d3.timeMonth.floor(p.time), timeFormat: d3.timeFormat("%b %Y")}
    const Weeks = {interval : (p) => d3.timeWeek.floor(p.time), timeFormat: d3.timeFormat("W%W %Y")}
    
    let time = Months;
    // const filterControl = L.Control({position: 'bottomright'});
    // filterControl._container = DomUtil.create('div', 'interval-filters');
    // filterControl._container.innerHTML = `
    //     <span>Years</span>
    //     <span>Months</span>
    //     <span>Weeks</span>
    // `

    const filterControl = document.querySelector('.leaflet-bottom.leaflet-left');
    // filterControl.classList.add('filter-control')
    // filterControl.classList.add('leaflet-control')
    filterControl.innerHTML = `
    <div class="filter-control leaflet-control">
        <span>Years</span>
        <span class="selected">Months</span>
        <span>Weeks</span>
    </div>
    `

    filterControl.addEventListener('click', (event)=>{
        if(event.target.tagName === 'SPAN'){
            [...filterControl.querySelectorAll('span')].forEach(t=>t.className='')
            const t = event.target.textContent
            time = {Years, Months, Weeks}[t];
            event.target.className = 'selected'
            update()
        }
    })
    
    let bounds = map.getBounds();
    
    map.on('moveend', ()=>{
        bounds = map.getBounds();
        update()
    })

    function update(){
        const {interval, timeFormat} = time;
        //if(popupElement.isOpen) return;
        const data = d3.groups(photos.filter(p=>bounds.contains(p.latlng)), interval)
        d3.select('#timeline')
            .selectAll('.photo-group')
            .remove()
        const photoGroups = d3.select('#timeline')
            .selectAll('.photo-group')
            .data(data)
            .join('div')
            .style('background-image', g => `url(${g[1][0].url.replace(/=(w\d+-)?h\d+(-pd)?/, '=h80')})`)
            .attr('class', 'photo-group')
            .on('click', (event, g)=>{
                const markers = g[1].map(p=>{
                    return {photo:p, latlng:p.latlng, url:p.url}
                });
                const marker = markers[0]
                const photo = marker.photo;
                const latlng = marker.latlng;
                popupImage({latlng, marker, photo, markers, index: 0});
            })
            .call(div => div.append('span')
                            .attr('class', 'photo-group-count')
                            .text(g=>g[1].length))
            .call(div => div.append('span')
                            .attr('class', 'photo-group-title')
                            .text(g=>timeFormat(g[0])))
        
            
    }
    update()

})()



