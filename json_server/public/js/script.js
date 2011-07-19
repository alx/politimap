/* Author: 

*/

var heatmap = null;
var canvas  = null;
var context = null;
var myStage = null;

function mapDisplayTooltip(e){
  $("#heatmapArea").prepend("<span id='heatmap_tooltip'>Cliquer pour selectionner...</span>");
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
  $("#heatmapArea").prepend("<span id='heatmap_loading'>chargement...</span>");
  $.getJSON("/heatmap", function(map){
    heatmap.store.setDataSet(map);
    seatCanvas(map['data']);
    $("#heatmap_loading").remove();
  });
}
$(document).ready(function(){
  
  heatmap = h337.create({"element":document.getElementById("heatmapArea"), "radius":8, "visible":true});
  refreshHeatmap();

  $("#radio_info").buttonset();
  $("#start_date").monthpicker("2011-03", refreshHeatmap);
  $("#end_date").monthpicker("2011-06", refreshHeatmap);

  $("input[type=radio]").click(refreshHeatmap);
});




















