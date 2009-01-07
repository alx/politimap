require 'rubygems'
require 'nokogiri'
require 'open-uri'
require 'htmlentities'

deputies = Hash.new

def deputy_name(deputy_id)
  fiche = "http://www.assemblee-nationale.fr/13/tribun/fiches_id/#{deputy_id}.asp"
  doc = Nokogiri::HTML(open(fiche))
  coder = HTMLEntities.new
  return coder.encode(doc.xpath('//h1[@class="titre"]').first.content, :decimal)
end

def deputy_seat(deputy_id)
  fiche = "http://www.assemblee-nationale.fr/13/tribun/fiches_id/#{deputy_id}.asp"
  doc = Nokogiri::HTML(open(fiche))
  return doc.xpath('//div[@id="phemi"]/p').first.content.slice(/: (\d+)/, 1)
end

def parse_sceance(deputies, sceance_url)
  doc = Nokogiri::HTML(open(sceance_url))

  doc.xpath('//p/b/a[@target="_top"]').each do |link|
    deputy = link['href'].slice(/(\d+).asp/, 1)
    
    if deputies.key?(deputy)
      deputies[deputy] = deputies[deputy].to_i + 1
    else
      deputies[deputy] = 1
    end
  end
end

parse_sceance(deputies, "http://www.assemblee-nationale.fr/13/cri/2008-2009/20090090.asp")

deputies.sort{|a,b| b[1]<=>a[1]}.each { |elem|
  puts "#{elem[1]}, <a href='http://www.assemblee-nationale.fr/13/tribun/fiches_id/#{elem[0]}.asp'>#{deputy_name(elem[0])}</a> - Place: #{deputy_seat(elem[0])}"
}


