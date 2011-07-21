/* Author: 

*/

var heatmap = null;
var canvas  = null;
var context = null;
var myStage = null;

function mapDisplayTooltip(e){
  if(!$("#heatmap_loading").is(":visible")){
    $("#heatmapArea").prepend("<span id='heatmap_tooltip'>Cliquer pour selectionner un député...</span>");
  }
}

function mapHideTooltip(e){
  $("#heatmap_tooltip").remove();
}

function seatCanvas(data){

  canvas = $("canvas")[0];
  context = canvas.getContext("2d");

  canvas.addEventListener("mouseover", mapDisplayTooltip, false);
  canvas.addEventListener("mouseout", mapHideTooltip, false);

  $("canvas").attr("id", "heatmapCanvas");
  myStage = new Kinetic("heatmapCanvas", "2d");

  myStage.setDrawStage(function(){
    $.each(data, function(index, data){

      // draw seat circle
      myStage.beginRegion();
      context.beginPath();
      context.arc(data.x, data.y, 6, 0, Math.PI * 2, true);
      //context.lineWidth = "0.2";
      //context.stroke();

      myStage.addRegionEventListener("onmousedown", function(){
        $.get("/depute/" + data.id, function(info){
          $("#info").html(info)
        });
      });

      myStage.addRegionEventListener("onmouseover", function(){
        $("body").css("cursor", "pointer");
      });

      myStage.addRegionEventListener("onmouseout", function(){
        $("body").css("cursor", "default");
      });

      myStage.closeRegion();
    });
  });
}

function refreshHeatmap(){
  
  $("#heatmap_loading").remove();

  var filters = {};

  filters["info"] = $("input:checked").val();

  var start_year = $("#start_date td:last span.selected").html();
  var start_month = $("#start_date td.month span.selected").parent().attr("title");
  filters["start_date"] = Date.parse(start_year + "-" + start_month);

  var end_year = $("#end_date td:last span.selected").html();
  var end_month = $("#end_date td.month span.selected").parent().attr("title");
  filters["end_date"] = Date.parse(end_year + "-" + end_month);

  if(filters["start_date"].compareTo(filters["end_date"]) == 1){
    $("#heatmapArea").prepend("<span id='heatmap_loading'>erreur sur les dates sélectionnées: la fin est avant le début...</span>");
  } else {

    filters["start_date"] = filters["start_date"].toString('yyyy/MM');
    filters["end_date"] = filters["end_date"].toString('yyyy/MM');

    $("#heatmapArea").prepend("<span id='heatmap_loading'>chargement...</span>");

    $.getJSON("/heatmap", filters, function(map){
      heatmap.store.setDataSet(map);
      seatCanvas(map['data']);
      $("#heatmap_loading").remove();
    });
  }
}
$(document).ready(function(){
  
  heatmap = h337.create({"element":document.getElementById("heatmapArea"), "radius":8, "visible":true});

  $("#radio_info").buttonset();

  $("#start_date").monthpicker({
    elements: [
      {tpl:"month",opt:{
        caption: 'Début',
        text: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'],
        value: 3
      }},
      {tpl:"year",opt:{
        caption: '',
        range: "-4~0",
        value: 2011
      }}
    ],
    onChanged: refreshHeatmap
  });

  
  $("#end_date").monthpicker({
    elements: [
      {tpl:"month",opt:{
        caption: 'Fin&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
        text: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'],
        value: 6
      }},
      {tpl:"year",opt:{
        caption: '',
        range: "-4~0",
        value: 2011
      }}
    ],
    onChanged: refreshHeatmap
  });

  $("input[type=radio]").click(refreshHeatmap);

  refreshHeatmap();
});




















