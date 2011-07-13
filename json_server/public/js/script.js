/* Author: 

*/

var heatmap;

$(document).ready(function(){
  heatmap = h337.create({"element":document.getElementById("heatmapArea"), "radius":8, "visible":true});

  $.getJSON("/heatmap", function(data){
    heatmap.store.setDataSet(data);
  });
});




















