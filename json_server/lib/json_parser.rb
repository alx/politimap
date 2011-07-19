require 'rubygems'
require 'net/http'
require 'json'
require 'pp'
require 'fileutils'

def create_name_table
  depute_seats = Array.new(650)
  
  depute_list = api_json("http://www.nosdeputes.fr/deputes/json")
  depute_list["deputes"].each do |json|

    depute = json["depute"]
    depute_api = api_json(depute["api_url"])

    id = depute["api_url"].gsub("http://www.nosdeputes.fr/", "").gsub("/json", "")
    name = depute_api["depute"]["nom"]
    seat = depute_api["depute"]["place_en_hemicycle"].to_i
    pp "name: #{name} - seat: #{seat}"

    if seat > 0
      depute_seats[seat] = {:name => name, :id => id}
    end

  end
  File.open('names.rb', 'w') do |file|
    file.write "$NAMES=[\n"
    depute_seats.each do |seat|
      if seat
        file.write("{:id => \"#{seat[:id]}\",:name => \"#{seat[:name]}\"},\n")
      else
        file.write("{},\n")
      end
    end
    file.write "]"
  end
end


def api_json(json_url)
  url = URI.parse(json_url)
  cached_file = File.join(File.dirname(__FILE__), "/../cache/", url.path)

  if File.exists? cached_file
    return JSON.load(File.open(cached_file))
  else
    req = Net::HTTP::Get.new(url.path)
    res = Net::HTTP.start(url.host, url.port) {|http|
      http.request(req)
    }
    
    FileUtils.mkdir_p File.dirname(cached_file)
    File.open(cached_file, "w"){|file| file.write(res.body)}

    return JSON.parse(res.body)
  end
end

def parse_synthese(date, info)
  json = api_json("http://www.nosdeputes.fr/synthese/#{date}/json")
  json["deputes"].each do |depute_json|
    depute = depute_json["depute"]
    
    nb_interventions = case info
    when "amendements"
      depute["amendements_adoptes"] + depute["amendements_signes"]
    when "commissions"
      depute["commission_interventions"] + depute["commission_presences"]
    when "hemicycle"
      depute["hemicycle_interventions"] + depute["hemicycle_interventions_courtes"]
    when "propositions"
      depute["propositions_ecrites"] + depute["propositions_signees"]
    when "questions"
      depute["questions_ecrites"] + depute["questions_orales"]
    end
    seat_index = $NAMES.index{|store| store[:name] == depute["nom"]}
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
