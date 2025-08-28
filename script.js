require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/WMTSLayer",
  "esri/widgets/Sketch",
  "esri/layers/FeatureLayer"
], function(Map, MapView, WMTSLayer, Sketch, FeatureLayer) {

  // 1. Crée une couche WMTS pour le fond de carte en RGNC 91-93
  const fondCarteNC = new WMTSLayer({
    url: "https://carto.gouv.nc/public/rest/services/fond_imagerie/MapServer/WMTS",
    tileMatrixSet: "RGNC93",
    copyright: "Gouvernement de la Nouvelle-Calédonie"
  });

  // 2. Crée la carte avec le fond de carte personnalisé
  const map = new Map({
    layers: [fondCarteNC]
  });

  // 3. Crée la vue de la carte centrée sur la Nouvelle-Calédonie
  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [165.4, -21.4],
    zoom: 8,
    spatialReference: { wkid: 3163 }
  });

  // 4. Ajoute le widget Sketch pour dessiner des points
  const sketch = new Sketch({
    view: view,
    layer: new FeatureLayer({
      url: "https://services1.arcgis.com/TZcrgU6CIbqWt9Qv/arcgis/rest/services/SAR_layers/FeatureServer"
    }),
    creationMode: "point"
  });
  view.ui.add(sketch, "top-right");

  // 5. Écoute l'événement de création de points
  sketch.on("create", function(event) {
    if (event.state === "complete") {
      const points = event.graphics;
      if (points.length === 2) {
        const x1 = points[0].geometry.x;
        const y1 = points[0].geometry.y;
        const x2 = points[1].geometry.x;
        const y2 = points[1].geometry.y;

        // 6. Appelle ton API
        fetch(`https://ton-api.onrender.com/generer-cercle?x1=${x1}&y1=${y1}&x2=${x2}&y2=${y2}`)
          .then(response => response.json())
          .then(data => {
            // 7. Ajoute les résultats à la couche SAR_layers
            const featureLayer = new FeatureLayer({
              url: "https://services1.arcgis.com/TZcrgU6CIbqWt9Qv/arcgis/rest/services/SAR_layers/FeatureServer",
              source: data.features,
              objectIdField: "ObjectID",
              fields: [{ name: "ObjectID", type: "oid" }]
            });
            map.add(featureLayer);
            view.goTo(data.features);
          })
          .catch(error => {
            console.error("Erreur lors de l'appel à l'API :", error);
          });
      }
    }
  });
});
