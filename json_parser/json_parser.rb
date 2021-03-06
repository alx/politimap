require 'rubygems'
require 'net/http'
require 'json'
require 'pp'

load 'seats.rb'
load 'names.rb'


def create_name_table
  depute_seats = Array.new(650)
  
  depute_list = api_json("http://www.nosdeputes.fr/deputes/json")
  depute_list["deputes"].each do |depute_json|

    depute = depute_json["depute"]
    depute_api = api_json(depute["api_url"])

    name = depute_api["depute"]["nom"]
    seat = depute_api["depute"]["place_en_hemicycle"].to_i
    pp "name: #{name} - seat: #{seat}"

    if seat > 0
      depute_seats[seat] = name
    end

  end
  File.open('names.rb', 'w') do |file|
    file.write "$NAMES=[\n"
    depute_seats.each do |name|
      file.write "\"#{name}\",\n"
    end
    file.write "]"
  end
end

def api_json(json_url)
  url = URI.parse(json_url)
  req = Net::HTTP::Get.new(url.path)
  res = Net::HTTP.start(url.host, url.port) {|http|
    http.request(req)
  }
  return JSON.parse(res.body)
end

def parse_synthese(date)
  json = api_json("http://www.nosdeputes.fr/synthese/#{date}/json")
  json["deputes"].each do |depute_json|
    depute = depute_json["depute"]
    nb_interventions = depute["hemicycle_interventions_courtes"]
    seat_index = $NAMES.index(depute["nom"])
    if seat_index.to_i > 0 && nb_interventions > 0
      if seat = $SEATS.select{|seat| seat[:id] == seat_index}.first
        if seat[:count]
          seat[:count] += nb_interventions
        else
          seat[:count] = nb_interventions
        end
      end
    end
  end
end

def seat_data
  max = 0
  output = "var test = {data: ["
  $SEATS.each do |seat|
    if seat[:count] && seat[:count] > 0
      max = seat[:count] if max < seat[:count]
    end
  end
  $SEATS.each do |seat|
    if seat[:count] && seat[:count] > 0
      output << "{count: #{max - seat[:count]}, x: #{seat[:x]}, y: #{seat[:y]}},"
    else
      output << "{count: #{max}, x: #{seat[:x]}, y: #{seat[:y]}},"
    end
  end  
  output << "], max: #{max}};"
  File.open('total.json', 'w') do |file|
    file.write output
  end
end

month = 201001
12.times do
  parse_synthese "#{month}"
  month += 1
end
seat_data
#create_name_table
