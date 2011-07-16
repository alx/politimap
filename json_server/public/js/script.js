/* Author: 

*/

var heatmap;

function refreshHeatmap(){
  $("#heatmapArea").prepend("<span id='heatmap_loading'>chargement...</span>")
  $.getJSON("/heatmap", function(data){
    heatmap.store.setDataSet(data);
    $("#heatmap_loading").remove();
  });
}
$(document).ready(function(){
  heatmap = h337.create({"element":document.getElementById("heatmapArea"), "radius":8, "visible":true});
  refreshHeatmap();
});




















