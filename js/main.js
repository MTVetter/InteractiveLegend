require([
  "esri/Map",
  "esri/views/MapView",
  "esri/widgets/Home",
  "esri/core/watchUtils",
  "esri/widgets/Expand",
  "esri/widgets/BasemapToggle",
  "esri/layers/FeatureLayer",
  "esri/views/layers/support/FeatureEffect",
  "esri/renderers/SimpleRenderer",
  "esri/renderers/ClassBreaksRenderer",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.4.0/Chart.js",
  "esri/PopupTemplate",
  "esri/popup/content/TextContent",
  "esri/popup/content/CustomContent",
  "esri/widgets/Legend"
], function(
  Map,
  MapView,
  Home,
  watchUtils,
  Expand,
  BasemapToggle,
  FeatureLayer,
  FeatureEffect,
  SimpleRenderer,
  ClassBreaksRenderer,
  SimpleLineSymbol,
  SimpleFillSymbol,
  Chart,
  PopupTemplate,
  TextContent,
  CustomContent,
  Legend
) {

  //Create the map
  var map = new Map({
    basemap: "streets-navigation-vector"
  });

  //Add the map view
  var view = new MapView({
    map: map,
    container: "viewDiv",
    center: [-95.444, 29.756],
    scale: 1300000,
    constraints: {
      snapToZoom: false
    },
    popup: {
      dockEnabled: true,
      dockOptions: {
        breakpoint: false,
        buttonEnabled: false,
        postion: "top-right"
      }
    }
  });

  //Add a Home button
  var homeWidget = new Home({
    view: view
  });
  view.ui.add(homeWidget, "top-left");

  //Create the legend widget
  const legendContainer = document.getElementById("legendDiv");
  const legend = new Legend({
    view: view,
    container: legendContainer
  });

  view.ui.add([
    new Expand({
      view: view,
      content: document.getElementById("controlDiv"),
      expanded: true,
      expandIconClass: "esri-icon-layer-list"
    })
  ], "bottom-left");

  //Create basemap toggle
  const baseToggle = new BasemapToggle({
    view: view,
    nextBasemap: "satellite"
  });
  view.ui.add(baseToggle, "bottom-right");

  //Create the renderer for the crash layer
  var crashRenderer = new ClassBreaksRenderer({
    field: "crash",
    legendOptions: {
      title: "Total Crashes"
    },
    classBreakInfos: [
      {
        symbol: new SimpleLineSymbol({
          color: "#999",
          width: 0.75
        }),
        label: "0 - 25",
        maxValue: 25
      },{
        symbol: new SimpleLineSymbol({
          color: "#7f7f7f",
          width: 2
        }),
        label: "26 - 50",
        minValue: 26,
        maxValue: 50
      },{
        symbol: new SimpleLineSymbol({
          color: "#595959",
          width: 3.5
        }),
        label: "51 - 100",
        minValue: 51,
        maxValue: 100
      },{
        symbol: new SimpleLineSymbol({
          color: "#6b2b38",
          width: 5
        }),
        label: "101 - 200",
        minValue: 101,
        maxValue: 200
      },{
        symbol: new SimpleLineSymbol({
          color: "#9c253d",
          width: 6
        }),
        label: "201 - 400",
        minValue: 201,
        maxValue: 400
      },{
        symbol: new SimpleLineSymbol({
          color: "#ff1947",
          width: 7.5
        }),
        label: "400 or more",
        minValue: 401,
        maxValue: 900
      }
    ]
  });

  //Create the popup for the segments
  var popup = {
    title: "{Full_Name}",
    content: [
      {
        type: "fields",
        fieldInfos: [
          {
            fieldName: "crash",
            label: "Number of All Types of Crashes",
            format: {
                places: 0,
                digitSeparator: true
            }
          },{
            fieldName: "mv",
            label: "Number of Motorist Crashes",
            format: {
                places: 0,
                digitSeparator: true
            }
          },{
            fieldName: "ped",
            label: "Number of Pedestrian Crashes",
            format: {
                places: 0,
                digitSeparator: true
            }
          },{
            fieldName: "bike",
            label: "Number of Cyclist Crashes",
            format: {
                places: 0,
                digitSeparator: true
            }
          },{
            fieldName: "fatality",
            label: "Number of Fatal Crashes",
            format: {
                places: 0,
                digitSeparator: true
            }
          },{
            fieldName: "Total_Injury",
            label: "Number of Total Injuries",
            format: {
                places: 0,
                digitSeparator: true
            }
          }
        ]
      }
    ]
  }

  //Create the Feature Layers
  var crashes = new FeatureLayer({
    url: "https://services1.arcgis.com/Z6SBWLWGRRejblAA/arcgis/rest/services/StarMap_Crashes/FeatureServer/0",
    renderer: crashRenderer,
    outFields: ["crash","Total_Injury","fatality","bike","ped","mv"],
    title: "StarMap Crashes",
    popupTemplate: popup,
    definitionExpression: "crash > 0"
  });

  const counties = new FeatureLayer({
    url: "https://services1.arcgis.com/Z6SBWLWGRRejblAA/arcgis/rest/services/Equity_Profiles_Places_BGs_Counties/FeatureServer/2",
    renderer: new SimpleRenderer({
      symbol: new SimpleFillSymbol({
        color: "rgba(255,255,255,0)",
        outline: new SimpleLineSymbol({
          color: "rgba(15,15,15, 0.5)",
          width: 0.75
        })
      })
    }),
    definitionExpression: "NAME NOT IN('Matagorda County','Austin County','Wharton County','Colorado County','Walker County')",
    legendEnabled: false
  });

  //Add the layers to the map
  map.add(counties);
  map.add(crashes);

  //Create the feature layer view
  let crashLayerView = null;

  //Create the layerview layer after the crashes have been loaded to the map
  view.when(function(){
    view.whenLayerView(crashes).then(function(layerView){
      crashLayerView = layerView;
    });
  });

  //Add a listener to the legend
  legendContainer.addEventListener("click", legendEventListener);

  //Create a reset button
  const resetButton = document.getElementById("reset-button");

  //Add a listener to the reset button
  resetButton.addEventListener("click", function(){
    crashLayerView.effect = new FeatureEffect({
      filter: {
        where: "1 = 1"
      }
    });
  });

  function legendEventListener(event){
    const selectedText = event.target.alt || event.target.innerText;
    const legendInfos = legend.activeLayerInfos.getItemAt(0).legendElements[0].infos;
    const matchFound = legendInfos.filter((info) => info.label === selectedText).length > 0;
    
    if (matchFound){
      showSelectedField(selectedText);
    } else {
      crashes.renderer = crashRenderer;
    }
  }

  function showSelectedField(legendLabel){
    const oldRenderer = crashes.renderer;
    const newRenderer = oldRenderer.clone();
    var text = newRenderer.classBreakInfos.filter(function(label){
      if (label.label === legendLabel){
        return true;
      }
    });

    if (text["0"].minValue == null){
      var maxValue = text["0"].maxValue;
      var filterExpression = "crash < " + maxValue;
    } else if (text["0"].minValue > 0 && text["0"].maxValue == 0){
      var minValue = text["0"].minValue;
      var maxValue = text["0"].maxValue;
      var filterExpression = "crash >= " + minValue;
    } else {
      var minValue = text["0"].minValue;
      var maxValue = text["0"].maxValue;
      var filterExpression = "crash > " + minValue + " AND crash <= " + maxValue;
    }

    crashLayerView.effect = new FeatureEffect({
      filter: {
        where: filterExpression
      },
      includedEffect: "drop-shadow(3px, 3px, 3px, black)",
      excludedEffect: "blur(5.5px) brightness(80%)"
    });
  }

});
