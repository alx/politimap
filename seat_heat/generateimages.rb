class Conf
    def initialize
        @data = {
            'logfile' => '../20090090.txt',
            'dotimage' => 'bolilla_32.png',
            'format' => 'png',
            'colorimage' => 'colors.png',
            'opacity' => "1",
            'dotwidth' => 32
        }
        raise "log file not found" unless File.exist?(@data['logfile'])
        raise "dot image not found" unless File.exist?(@data['dotimage'])
        raise "color image not found" unless File.exist?(@data['colorimage'])
    end
    attr_reader :data
end
class Click
    def initialize(x,y)
        @x=x
        @y=y
    end
    def x
        return @x.to_i
    end
    def y
        return @y.to_i
    end
    def xy
        return "x"+@x+"y"+@y
    end
end
class Log
    def initialize (x,y,list)
        @line = 0
        @x=x
        @y=y
        @list=list
        @points = Hash.new(0)
        @list.each do |point|
            @points[point.xy] +=1
        end
        @reps = @points.values.max
    end
    attr_reader :x, :y, :list, :reps
    def next
        coord = @list[@line]
        @line += 1
        return coord
    end
end

class SeatHeat
  attr_reader :seat_id, :speech_num, :x, :y
  def initialize (seat_id, speech_num)
    @seat_id = seat_id.to_i
    @speech_num = speech_num.to_i
    
    x, y = 0
    File.open('seatmap.txt', 'r') do |f|
      while line = f.gets
        if line[/^#{@seat_id}/]
          id, x, y = line.split(",")
        end
      end
    end
    
    @x = x.to_i
    @y = y.to_i
  end
  
  def xy
    return "x#{@x}y#{y}"
  end
end

class Readparsefile
  def initialize(name)
    @name = name
    @data = Array.new
    lines = IO.readlines(@name).collect { |l| l.chomp }
    for line in lines
        speech_num, seat_id = line.split(/,/)
        if (speech_num and seat_id)
            #speech_num.to_i.times do 
              @data.push(SeatHeat.new(seat_id, speech_num))
            #end
        else
            $stderr.puts "Warning: Bogus line "<< line
        end
    end
    raise "no seats found" unless lines.length > 0
  end
  def coords
    xMax=0
    yMax=0
    coords = Array.new
    @data.each do |line|
        coords.push(line)
        xMax=line.x if line.x>xMax
        yMax=line.y if line.y>yMax
    end
    return Log.new(xMax,yMax,coords)
  end
end
class Image
    def initialize(data,conf)
        @data = data
        @name = "20090090"
        @conf=conf.data
    end
    def normalizespot
        #divide spot.png intensity by max. position reps (@data.reps)
        intensity = (100-(100/@data.reps).ceil).to_s
        normalize = "convert "<<@conf['dotimage']<<" -fill white -colorize "<<intensity<<"% "<<@name<<".bol.png"
        system(normalize)
    end
    def iterate
        halfwidth=@conf['dotwidth']/2
        compose = "convert -page 459x300 pattern:gray100 "
        
        maxValue = 0
        @data.list.each do |dot|
          maxValue = dot.speech_num if maxValue < dot.speech_num
        end
        
        #iterate spots
        @data.list.each do |dot|
            intensity = (((100*dot.speech_num)/maxValue).ceil).to_s
            puts intensity
            normalize = "convert #{@conf['dotimage']} -fill white -colorize #{intensity}% #{@name}_#{intensity}.bol.png"
            system(normalize)
            compose << "-page +#{((dot.x)-halfwidth).to_s}+#{((dot.y)-halfwidth).to_s} #{@name}_#{intensity}.bol.png "
        end
        compose << "-background white -compose multiply -flatten "<<@name<<".empty.png"
        system(compose)
    end
    def colorize
        #invert image...
        invert = "convert "<<@name<<".empty.png -negate "<<@name<<".full.png"
        system(invert)
        #colorize it...
        colorize = "convert "<<@name<<'.full.png -type TruecolorMatte '<<@conf['colorimage']<<' -fx "v.p{0,u*v.h}" '<<@name<<".colorized.png"
        system(colorize)
        #and apply transparency...
        transparency = "convert "<<@name<<'.colorized.png -channel A -fx "A*'<<@conf['opacity']<<'"  '<<@name<<'.final.'<<@conf['format']
        system(transparency)
    end
end
conf = Conf.new
file = Readparsefile.new(conf.data['logfile'])

image = Image.new(file.coords,conf)
image.iterate
image.colorize