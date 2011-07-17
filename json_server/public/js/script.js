/* Author: 

*/

var heatmap = null;
var canvas = null;
var context = null;
var myStage = null;
var message = "";

function getCursorPosition(e) {
  var x;
  var y;

  if (e.pageX != undefined && e.pageY != undefined) {
    x = e.pageX;
    y = e.pageY;
  } else {
    x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }

  x -= $("#heatmapArea").offset().left;
  y -= $("#heatmapArea").offset().top;

  return {'x': x, 'y': y};
}


function mapOnClick(e){
  var seat = getCursorPosition(e);
  console.log("seat: " + seat['x'] + " - " + seat['y']);
}

function mapDisplayTooltip(e){
  $("#heatmapArea").prepend("<span id='heatmap_tooltip'>Cliquer pour selectionner...</span>");
}

function mapHideTooltip(e){
  $("#heatmap_tooltip").remove();
}

function refreshHeatmap(){
  $("#heatmapArea").prepend("<span id='heatmap_loading'>chargement...</span>");
  $.getJSON("/heatmap", function(map){

    heatmap.store.setDataSet(map);
    $("#heatmap_loading").remove();

    $("canvas").attr("id", "heatmapCanvas");
    canvas = $("canvas")[0];
    context = canvas.getContext("2d");

    //canvas.addEventListener("click", mapOnClick, false);
    canvas.addEventListener("mouseover", mapDisplayTooltip, false);
    canvas.addEventListener("mouseout", mapHideTooltip, false);

    myStage = new Kinetic("heatmapCanvas", "2d");

    myStage.setDrawStage(function(){
      $.each(map['data'], function(index, data){
            // draw red circle
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
  });
}
$(document).ready(function(){
  heatmap = h337.create({"element":document.getElementById("heatmapArea"), "radius":8, "visible":true});
  refreshHeatmap();
});




















