seat_file = "/Users/alx/dev/tetalab/politimap/seat_map/seatmap.txt"

Shoes.app :title => "Seat Map" , :width => 600 do
  
  current = 136
  last_log=""
  
  image("seat_map.jpg")
  
  @p = para
  animate do
    button, left, top = self.mouse
    @p.replace "mouse: #{button}, #{left}, #{top}\ncurrent seat: #{current}\nlast log: #{last_log}"
  end
  
  click do |button, x, y|  
    # Do not log if superior at seats height
    #if y < 260
      last_log = "{id: #{current}, x: #{x - 1}, y: #{y + 5}, count:90},"
      File.open(seat_file, 'a') do |f|
        f.puts "#{last_log}\n"  
      end
    #end
  
    # Update in all case, allow to pass missing numbers by clicking in grey area
    current += 1
    if [
      4,   29,   34,  37,  42,  46,  55,  61,  65,  69,  74, 
      107, 115, 121, 131, 141, 159, 160, 161, 194,
      202, 208, 218, 229, 246, 247, 252, 275, 283, 289, 299,
      310, 316, 328, 355, 363, 369, 379, 390, 396, 
      408, 435, 443, 449, 459, 470, 476, 477,
      521, 529, 535, 556, 562, 563, 575, 579, 598,
      605, 608, 613, 617, 622, 631, 635, 641, 646, 647
    ].include? current
      current += 1
      current += 1  if [247, 477, 563, 647].include?(current)
      current = 162 if current == 160
    end
  end
  
end
