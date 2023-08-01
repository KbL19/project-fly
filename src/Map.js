import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import * as turf from '@turf/turf';

// Import marker icons
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-shadow.png';
import 'leaflet-curve';

const Wrapper = styled.div`
    width: ${props => props.width};
    height: ${props => props.height};
`;

const Map = ({ center, zoom, width, height }) => {
    const mapRef = useRef(null);

    // Define the plane icon
    const planeIcon = new L.Icon({
        iconUrl: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M18 16v2a1 1 0 0 1 -1 1h-2v-1H9v1H7a1 1 0 0 1 -1 -1v-2L2 8V6a1 1 0 0 1 1 -1h6V4a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v1h6a1 1 0 0 1 1 1v2l-6 8z" /></svg>'),
        iconSize: [38, 38], // size of the icon
    });
    


    useEffect(() => {

        // Fix the markers path
        delete L.Icon.Default.prototype._getIconUrl;

        L.Icon.Default.mergeOptions({
            iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
            iconUrl: require('leaflet/dist/images/marker-icon.png'),
            shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
        });


        mapRef.current = L.map('map', {
            center: center,
            zoom: zoom,
            layers: [
                L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                    maxZoom: 18,
                }),
            ],
        });

        const origin = [51.505, -0.09];
        const destination = [50.8566, 4.4522];  // Ending point

        // Create a GeoJSON line string of a great circle arc between the two points
        var line = turf.greatCircle(turf.point(origin), turf.point(destination));

        // Convert the GeoJSON line string to a Leaflet Polyline
        var polyline = L.geoJSON(line).getLayers()[0];

        // Add the polyline to the map
        polyline.addTo(mapRef.current);

        // Create the plane marker at the starting point
        let planeMarker = L.marker(origin, { icon: planeIcon }).addTo(mapRef.current);

        // Get the coordinates of the polyline
        const coordinates = polyline.getLatLngs();

        // Animate the plane marker along the path
        let i = 0;
        const speed = 200; // Adjust speed as needed
        function animatePlane() {
            planeMarker.setLatLng(coordinates[i]);
            if (i < coordinates.length - 1) {
                i++;
                setTimeout(animatePlane, speed);
            }
        }

        // Add a marker to the origin location
        L.marker(origin).addTo(mapRef.current);
        L.marker(destination).addTo(mapRef.current);

        // Draw a curved line between the points
        const curvedLine = L.curve(
            [
                'M', origin,
                'Q', [51.774, 2.377],
                destination
            ],
            {
                color: 'red',
                fill: false
            }
        ).addTo(mapRef.current);

        setTimeout(() => {
            mapRef.current.flyTo(origin, 6);
            
            animatePlane();

        }, 500);

        // Return cleanup function
        return () => {
            // Check if map exists before trying to remove it
            if (mapRef.current != null) {
                mapRef.current.remove();
            }
        }
    }, [center, zoom]);

    return <Wrapper id="map" width={width} height={height} />;
};

export default Map;
