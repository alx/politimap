require 'rubygems'
require 'bundler/setup'
require 'sinatra'
require File.join(File.dirname(__FILE__), 'environment')

configure do
  set :views, "#{File.dirname(__FILE__)}/views"
end

error do
  e = request.env['sinatra.error']
  Kernel.puts e.backtrace.join("\n")
  'Application error'
end

helpers do
  # add your helpers here
end

# root page
get '/' do
  erb :root
end

get '/heatmap' do
  content_type :json
  
  $SEATS.each{|seat| seat[:count] = 0}

  start_date = Date.parse params[:start_date]
  end_date = Date.parse params[:end_date]

  start_date = Date.today if start_date > Date.today
  end_date = Date.today if end_date > Date.today

  start_date = Date.new(2007, 06) if start_date < Date.new(2007, 6)
  end_date = Date.new(2007, 06) if end_date < Date.new(2007, 6)

  current_date = start_date
  while current_date <= end_date
    parse_synthese current_date.strftime("%Y%m").to_i, params[:info]
    current_date = current_date >> 1
  end
  
  max = 0
  $SEATS.each do |seat|
    if seat[:count] && seat[:count] > 0
      max = seat[:count] if max < seat[:count]
    end
  end
  {:max => max, :data => $SEATS}.to_json
end

get '/depute/:seat' do
  @depute_id = $NAMES[params[:seat].to_i][:id]
  depute_url = "http://www.nosdeputes.fr/#{@depute_id}/json"
  json = api_json(depute_url)
  @depute = json["depute"]
  erb :depute, :layout => false
end
