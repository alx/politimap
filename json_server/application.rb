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
  month = 201104
  3.times do
    parse_synthese "#{month}"
    month += 1
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
