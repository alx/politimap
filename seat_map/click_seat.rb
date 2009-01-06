seat_file = "/Users/alx/dev/politimap/seat_map/seatmap.txt"

Shoes.app :title => "Seat Map" , :width => 459 do
  
  current = 642
  last_log=""
  
  image("seat_map.jpg")
  
  @p = para
  animate do
    button, left, top = self.mouse
    @p.replace "mouse: #{button}, #{left}, #{top}\ncurrent seat: #{current}\nlast log: #{last_log}"
  end
  
  click do |button, x, y|  
    # Do not log if superior at seats height
    if y < 260
      last_log = "#{current}, #{x}, #{y}"
      File.open(seat_file, 'a') do |f|
        f.puts "#{last_log}\n"  
      end
    end
  
    # Update in all case, allow to pass missing numbers by clicking in grey area
    current += 1
  end
  
end