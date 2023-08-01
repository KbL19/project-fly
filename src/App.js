import React, { useEffect, useRef, useState } from 'react';
import * as turf from '@turf/turf';
import maplibregl from 'maplibre-gl';
import './App.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import planeIcon from './plane.png';

// mapboxgl.accessToken = 'pk.eyJ1Ijoia2JsLTk3IiwiYSI6ImNsa3I4ZngyZDA2cnIzZG8xbWpwd29mN24ifQ.rhvvi5jx6NJsMezIaLxNkA';

const App = () => {

  const mapContainerRef = useRef(null);
  let myMap, animation, animateLine;

  const getMap = () => {
    return new maplibregl.Map({
      container: mapContainerRef.current, // container id
      style: 'https://demotiles.maplibre.org/style.json', // style URL
      center: [0, 0], // starting position [lng, lat]
      zoom: 1 // starting zoom
    });
  }

  const createLine = (origin, destination) => {
    return {
      'type': 'FeatureCollection',
      'features': [{
        'type': 'Feature',
        'geometry': {
          'type': 'LineString',
          'coordinates': [origin, destination]
        }
      }]
    };
  }

  const getAnimatingPoint = (origin) => {
    return {
      'type': 'FeatureCollection',
      'features': [{
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'Point',
          'coordinates': origin
        }
      }]
    };
  }

  // This function calculates the current point on the straight line
  function getStraightLinePoint(origin, destination, t) {
    const [x1, y1] = origin;
    const [x2, y2] = destination;

    const x = x1 + t * (x2 - x1);
    const y = y1 + t * (y2 - y1);

    return [x, y];
  }


  useEffect(() => {
    myMap = getMap();

    // San Francisco
    const origin = [-122.414, 37.776];

    // Washington DC
    // const destination = [-77.032, 38.913];
    const destination = [-96.171851, 31.829513];

    // A simple line from origin to destination.
    const route = createLine(origin, destination);

    // A single point that animates along the route.
    // Coordinates are initially set to origin.
    const point = getAnimatingPoint(origin);

    // Calculate the distance in kilometers between route start/end point.
    const lineDistance = turf.length(route.features[0]);

    const arc = [];

    // Number of steps to use in the arc and animation, more steps means
    // a smoother arc and animation, but too many steps will result in a
    // low frame rate
    const steps = 150;
    // Set the curvature factor - higher means more curve
    const curvature = 1;

    // Draw an arc between the `origin` & `destination` of the two points
    for (let i = 0; i < lineDistance; i += lineDistance / steps) {
      const segment = turf.along(route.features[0], i);
      // Calculate the vertical offset based on the current step and curvature
      const offset = Math.sin((Math.PI * i / lineDistance)) * curvature;

      // Apply the vertical offset to the y-coordinate
      segment.geometry.coordinates[1] += offset;
      arc.push(segment.geometry.coordinates);
    }

    // Update the route with calculated arc coordinates
    route.features[0].geometry.coordinates = arc;

    new maplibregl.Marker()
      .setLngLat(origin)
      .addTo(myMap);

    // Add the popup
    new maplibregl.Popup({ className: 'test-class', offset: 25, closeOnClick: false, closeButton: false })
      .setLngLat(origin) // replace with your longitude and latitude
      .setText('San Francisco') // replace with your place name
      .addTo(myMap);

    let counter = 0;
    let maxIconSize = 1;
    myMap.on('load', () => {

      myMap.loadImage(planeIcon, function (err, image) {
        if (err) console.log("err: ", err);
        if (!err)
          myMap.addImage('plane-icon', image);
      })

      // Add a source and layer displaying a point which will be animated in a circle.
      myMap.addSource('route', {
        'type': 'geojson',
        'data': route
      });

      // myMap.addSource('point', {
      //   'type': 'geojson',
      //   'data': point
      // });

      // Add a source
      myMap.addSource('point', {
        'type': 'geojson',
        'data': {
          'type': 'FeatureCollection',
          'features': [
            {
              'type': 'Feature',
              'geometry': {
                'type': 'Point',
                'coordinates': origin // replace with your longitude and latitude
              }
            }
          ]
        }
      });

      myMap.addSource('progressive-line', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': [origin, origin]
          }
        }
      });

      // Create a source for the straight progressive line
      myMap.addSource('straight-progressive-line', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': [origin, origin]
          }
        }
      });

      // map.addLayer({
      //   'id': 'point',
      //   'source': 'point',
      //   'type': 'symbol',
      //   'layout': {
      //     // This icon is a part of the Mapbox Streets style.
      //     // To view all images available in a Mapbox style, open
      //     // the style in Mapbox Studio and click the "Images" tab.
      //     // To add a new image to the style at runtime see
      //     // https://docs.mapbox.com/mapbox-gl-js/example/add-image/
      //     'icon-image': 'airport',
      //     'icon-size': 0,
      //     'icon-rotate': ['get', 'bearing'],
      //     'icon-rotation-alignment': 'map',
      //     'icon-allow-overlap': true,
      //     'icon-ignore-placement': true
      //   }
      // });


      // Load the image into the map
      // myMap.loadImage('https://static.vecteezy.com/system/resources/previews/014/455/865/original/plane-icon-icon-on-transparent-background-free-png.png', function (error, image) {
      //   if (error) throw error;

      //   // Add the image to your map's style
      //   myMap.addImage('plane', image);

      //   // Add a layer using this image
      //   myMap.addLayer({
      //     'id': 'point',
      //     'type': 'symbol',
      //     'source': 'point',
      //     'layout': {
      //       'icon-image': 'plane',
      //       'icon-size': 0  // adjust size as needed
      //     }
      //   });
      // });


      // myMap.addLayer({
      //   'id': 'point',
      //   'type': 'circle',
      //   'source': 'point',
      //   'paint': {
      //     'circle-radius': 0,
      //     'circle-color': '#007cbf'
      //   }
      // });

      // Add a layer to use the image to represent the data
      let coordinates = route.features[0].geometry.coordinates;
      let start = coordinates[counter];
      let end = coordinates[counter + 1];
      let bearing = turf.bearing(start, end);

      // Adjust bearing based on the initial rotation of your icon
      let adjustedBearing = bearing - 45;
      myMap.addLayer({
        'id': 'point',
        'type': 'symbol',
        'source': 'point',
        'layout': {
          'icon-image': 'plane-icon',  // your image
          'icon-rotate': adjustedBearing,
          'icon-size': 0  // change the size as needed
        }
      });

      myMap.addLayer({
        'id': 'progressive-line',
        'type': 'line',
        'source': 'progressive-line',
        'paint': {
          'line-width': 2,
          'line-color': '#007cbf',
          'line-dasharray': [2, 2]
        }
      });

      // Add a layer for the straight progressive line
      myMap.addLayer({
        'id': 'straight-progressive-line',
        'type': 'line',
        'source': 'straight-progressive-line',
        'paint': {
          'line-width': 2,
          'line-color': '#808080',
          'line-dasharray': [2, 2]
        }
      });

      // Set up the animation
      const animateLine = () => {
        const curvedLineData = myMap.getSource('progressive-line')._data;
        if (curvedLineData.geometry.coordinates.length > 1) {
          const origin = curvedLineData.geometry.coordinates[0];
          const currentPoint = curvedLineData.geometry.coordinates[curvedLineData.geometry.coordinates.length - 1];
          const totalDistance = turf.distance(origin, destination, { units: 'kilometers' });
          const currentDistance = turf.distance(origin, currentPoint, { units: 'kilometers' });
          const progress = currentDistance / totalDistance;

          // Update the straight line's coordinates based on the progress
          const pointOnStraightLine = [
            origin[0] * (1 - progress) + destination[0] * progress,
            origin[1] * (1 - progress) + destination[1] * progress,
          ];
          myMap.getSource('straight-progressive-line').setData({
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': [origin, pointOnStraightLine]
            }
          });
        }
      };

      let running = false;



      function animate() {

        running = true;
        document.getElementById('replay').disabled = true;
        const start =
          route.features[0].geometry.coordinates[
          counter >= steps ? counter - 1 : counter
          ];
        const end =
          route.features[0].geometry.coordinates[
          counter >= steps ? counter : counter + 1
          ];
        if (!start || !end) {
          running = false;
          document.getElementById('replay').disabled = false;
          return;
        }
        // Update point geometry to a new position based on counter denoting
        // the index to access the arc
        point.features[0].geometry.coordinates =
          route.features[0].geometry.coordinates[counter];

        // Calculate the bearing to ensure the icon is rotated to match the route arc
        // The bearing is calculated between the current point and the next point, except
        // at the end of the arc, which uses the previous point and the current point
        point.features[0].properties.bearing = turf.bearing(
          turf.point(start),
          turf.point(end)
        );

        let iconSize = maxIconSize * Math.sin((Math.PI * counter) / steps);

        // Update the source with this new data
        myMap.getSource('point').setData(point);
        myMap.stop();
        myMap.flyTo({
          center: point.features[0].geometry.coordinates,
          essential: true,
          speed: 0.5,
          curve: 1
        });
        // map.setCenter(point.features[0].geometry.coordinates);

        myMap.getSource('progressive-line').setData({
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': route.features[0].geometry.coordinates.slice(0, counter + 1)
          }
        });

        animateLine();

        // myMap.setPaintProperty('point', 'circle-radius', iconSize);
        myMap.setLayoutProperty('point', 'icon-size', iconSize);

        // Request the next frame of animation as long as the end has not been reached
        // if (counter < steps) {
        //   cancelAnimationFrame(animation);
        //   animation = requestAnimationFrame(animateCamera);
        // }
        // Check if animation completed

        // get next point along the line
        const nextPoint = turf.along(route.features[0], counter + 1 / steps);

        // get bearing to next point
        const bearing = turf.bearing(turf.point(coordinates[counter]), turf.point(nextPoint.geometry.coordinates));

        // adjust the bearing
        const adjustedBearing = bearing - 45;

        // update the plane's position and rotation
        myMap.getSource('point').setData({
          type: 'Point',
          coordinates: coordinates[counter]
        });

        // update the plane's rotation
        myMap.setLayoutProperty('point', 'icon-rotate', adjustedBearing + 180 );



        if (counter < steps) {
          // Continue the animation
          // animateLine();
          cancelAnimationFrame(animation);
          animation = requestAnimationFrame(animateCamera);
        } else {
          // End marker
          // const markerEnd = new maplibregl.Marker({ color: 'green' })
          //   .setLngLat(destination)
          //   .addTo(myMap);
          // Initial marker set above the final location
          // const el = document.createElement('div');
          // el.id = 'animatedMarker';
          // el.innerHTML = `
          //   <img id="svgMarker" src="marker.svg" width="27" height="41" style="transition: all 200ms linear;"/>
          //   `;
          const markerEnd = new maplibregl.Marker()
            .setLngLat(destination)
            .setOffset([0, -50]) // Initial offset to simulate height
            .addTo(myMap);

          console.log("marker end offset", markerEnd.getOffset())

          // Animation
          let totalTime = 100; // Duration of the animation in milliseconds. Adjust as necessary.
          let startTime = Date.now();
          // let svgMarker = document.getElementById('svgMarker');

          // svgMarker.style.height = '61px';
          // svgMarker.style.width = '47px';

          function animateMarker() {
            let now = Date.now();
            let elapsed = now - startTime;

            if (elapsed < totalTime) {
              let fraction = elapsed / totalTime;
              let currentOffset = -50 * (1 - fraction) - 14; // 50 is the initial offset
              markerEnd.setOffset([0, currentOffset]);
              // svgMarker.style.height = (61 - fraction * 20) + 'px'; // Starts at 61px, ends at 41px
              // svgMarker.style.width = (47 - fraction * 20) + 'px'; // Starts at 47px, ends at 27px
              requestAnimationFrame(animateMarker);
            } else {
              markerEnd.setOffset([0, -14]);
              // Add the popup
              // Assuming `text` is the text you want to animate
              let text = "Texas";
              let animatedText = '';
              for (let i = 0; i < text.length; i++) {
                animatedText += `<span style="animation-delay: ${i * 0.1}s">${text[i]}</span>`;
              }

              new maplibregl.Popup({ closeButton: false, closeOnClick: false })
                .setLngLat([destination[0], destination[1]])
                .setOffset([0, -25])
                .setHTML(animatedText) // Use setHTML instead of setText to allow HTML content
                .addTo(myMap);
              // new maplibregl.Popup({ className: 'test-class', offset: 25, closeOnClick: false, closeButton: false })
              //   .setLngLat(destination) // replace with your longitude and latitude
              //   .setText('Texas') // replace with your place name
              //   .addTo(myMap);
              // svgMarker.style.height = '41px'; // Original size
              // svgMarker.style.width = '27px'; // Original size
              cancelAnimationFrame(animateMarker);
            }
          }


          requestAnimationFrame(animateMarker);


          running = false;
          document.getElementById('replay').disabled = false;
          return;
        }

        counter = counter + 1;
      }

      function animateCamera() {
        if (counter < steps) {
          myMap.stop();
          myMap.flyTo({
            center: point.features[0].geometry.coordinates,
            speed: 0.5, // make the flying slow
            curve: 1, // change the speed at which it zooms out
            easing: function (t) {
              return t;
            }
          });
          // map.setCenter(point.features[0].geometry.coordinates);

          // Restart the plane animation once the flyTo completes.
          myMap.once('moveend', () => { animate() });
        }
      }






      myMap.flyTo({
        // These options control the ending camera position: centered at
        // the target, at zoom level 9, and north up.
        center: origin,
        zoom: 4,
        bearing: 0,

        // These options control the flight curve, making it move
        // slowly and zoom out almost completely before starting
        // to pan.
        speed: 0.75, // make the flying slow
        curve: 2, // change the speed at which it zooms out

        // This can be any easing function: it takes a number between
        // 0 and 1 and returns another number between 0 and 1.
        easing(t) {
          return t;
        },

        // this animation is considered essential with respect to prefers-reduced-motion
        essential: true
      });

      const startAnimation = () => {
        animate(counter);
      }

      myMap.on('zoomend', startAnimation)
    })

    return () => {
      if (myMap) myMap.remove();
      cancelAnimationFrame(animation);
    }
  })

  return (
    <div className="App">
      <div id="map" ref={mapContainerRef} style={{ width: "100%", height: "100vh" }}></div>
      <div className="overlay">
        <button id="replay">Replay</button>
      </div>
    </div>
  )
};

export default App;