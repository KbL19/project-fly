import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoia2JsLTk3IiwiYSI6ImNsa3I4ZngyZDA2cnIzZG8xbWpwd29mN24ifQ.rhvvi5jx6NJsMezIaLxNkA';

const App = () => {

  const mapContainerRef = useRef(null);

  const getMap = () => {
    return new mapboxgl.Map({
      container: mapContainerRef.current,
      // Choose from Mapbox's core styles, or make your own style with Mapbox Studio,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-96, 37.8],
      zoom: 3,
      pitch: 40,
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

  useEffect(() => {

    let map;
    let animation;

    const initializeProject = async () => {
      map = getMap();

      // San Francisco
      const origin = [-122.414, 37.776];

      // Washington DC
      const destination = [-77.032, 38.913];

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

      // Draw an arc between the `origin` & `destination` of the two points
      for (let i = 0; i < lineDistance; i += lineDistance / steps) {
        const segment = turf.along(route.features[0], i);
        arc.push(segment.geometry.coordinates);
      }

      // Update the route with calculated arc coordinates
      route.features[0].geometry.coordinates = arc;

      // Used to increment the value of the point measurement against the route.
      let counter = 0;
      let maxIconSize = 3;
      map.on('load', () => {

        // Start marker
        const markerStart = new mapboxgl.Marker({ color: 'red' })
          .setLngLat(origin)
          .addTo(map);
        // Add a source and layer displaying a point which will be animated in a circle.
        map.addSource('route', {
          'type': 'geojson',
          'data': route
        });

        map.addSource('point', {
          'type': 'geojson',
          'data': point
        });

        map.addSource('progressive-line', {
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
        //   'id': 'route',
        //   'source': 'route',
        //   'type': 'line',
        //   'paint': {
        //     'line-width': 2,
        //     'line-color': '#007cbf'
        //   }
        // });

        map.addLayer({
          'id': 'point',
          'source': 'point',
          'type': 'symbol',
          'layout': {
            // This icon is a part of the Mapbox Streets style.
            // To view all images available in a Mapbox style, open
            // the style in Mapbox Studio and click the "Images" tab.
            // To add a new image to the style at runtime see
            // https://docs.mapbox.com/mapbox-gl-js/example/add-image/
            'icon-image': 'airport',
            'icon-size': 0,
            'icon-rotate': ['get', 'bearing'],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          }
        });
        // map.addLayer({
        //   'id': 'point',
        //   'type': 'circle',
        //   'source': 'point',
        //   'paint': {
        //     'circle-radius': 10,
        //     'circle-color': '#007cbf'
        //   }
        // });

        map.addLayer({
          'id': 'progressive-line',
          'type': 'line',
          'source': 'progressive-line',
          'paint': {
            'line-width': 2,
            'line-color': '#007cbf'
          }
        });

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
          map.getSource('point').setData(point);

          map.flyTo({
            center: point.features[0].geometry.coordinates,
            essential: true,
            speed: 0.5,
            curve: 1
          });
          // map.setCenter(point.features[0].geometry.coordinates);

          map.getSource('progressive-line').setData({
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': route.features[0].geometry.coordinates.slice(0, counter + 1)
            }
          });

          map.setLayoutProperty('point', 'icon-size', iconSize);

          // Request the next frame of animation as long as the end has not been reached
          // if (counter < steps) {
          //   cancelAnimationFrame(animation);
          //   animation = requestAnimationFrame(animateCamera);
          // }
          // Check if animation completed
          if (counter < steps) {
            // Continue the animation
            cancelAnimationFrame(animation);
            animation = requestAnimationFrame(animateCamera);
          } else {
            // End marker
            const markerEnd = new mapboxgl.Marker({ color: 'green' })
              .setLngLat(destination)
              .addTo(map);

            running = false;
            document.getElementById('replay').disabled = false;
            return;
          }

          counter = counter + 1;
        }

        function animateCamera() {
          if (counter < steps) {
            map.flyTo({
              center: point.features[0].geometry.coordinates,
              speed: 0.5, // make the flying slow
              curve: 1, // change the speed at which it zooms out
              easing: function (t) {
                return t;
              }
            });
            // map.setCenter(point.features[0].geometry.coordinates);

            // Restart the plane animation once the flyTo completes.
            map.once('moveend', () => animate());
          }
        }


        map.flyTo({
          center: origin,
          zoom: 5, // The final zoom level you want
          speed: 0.5, // Controls the speed of the animation. Higher value means faster animation.
          curve: 2, // Controls the rate of easing, which determines how quickly or slowly the animation proceeds.
          essential: true, // Ensures the animation proceeds even under constrained resources

        });

        map.on('zoomend', () => animate(counter))

        // Start the animation
        // animate(counter);



      })

    }

    initializeProject();

    // return a cleanup function
    return () => {
      if (map) map.remove();
      cancelAnimationFrame(animation);
    };

  }, [])

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
