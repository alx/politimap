require 'rubygems'
require 'hpricot'
require 'open-uri'
require 'htmlentities'

deputies = Hash.new

#
# Récupère les infos d'un député
#
# -----
# Params:
# options<Hash>:                    options pour récupèrer les infos d'un député
# options[:legislature]<Integer>:   legislature à laquelle appartient ce député (default: 13)
# options[:deputy_id]<Integer>:     identifiant du député
#
# -----
# Returns:
# <Hash>: contient les informations concerant le député trouvé sur sa fiche
# 
def deputy_name(options = {:legislature => 13})
  
  coder = HTMLEntities.new
  deputy = Hash.new
  
  # XPath vers les information de la fiche
  DEPUTY_NAME = '//h1[@class="titre"]'
  DEPUTY_SEAT = '//div[@id="phemi"]/p'
  
  # Récupère la fiche du député
  fiche_url = "http://www.assemblee-nationale.fr/#{options[:legislature]}/tribun/fiches_id/#{options[:deputy_id]}.asp"
  doc = Hpricot(open(fiche_url))
  
  # Analyse de la fiche récupérée pour extraire les informations
  deputy[:name] = coder.encode(doc.xpath(DEPUTY_NAME).first.content, :decimal)
  deputy[:seat] = doc.xpath(DEPUTY_SEAT).first.content.slice(/: (\d+)/, 1)
  
  return deputy 
end


#
# Récupère les infos d'un compte rendu intégral d'une scéance à l'assemblée
#
# -----
# Params:
# options<Hash>:                    options pour récupèrer les infos d'une scéance
# options[:legislature]<Integer>:   legislature durant laquelle à eu lieu cette scéance (défaut: 13)
# options[:years]<String>:          années durant laquelle à eu lieu cette scéance (défaut: 2008-2009)
# options[:sceance_id]<Integer>:    identifiant de cette scéance
#
# -----
# Returns:
# <Hash>: contient les informations concerant la scéance
#
def parse_sceance(options = {:legislature => 13, :years => "2008-2009"})
  
  cri_url = "http://www.assemblee-nationale.fr/#{options[:legislature]}/cri/#{options[:years]}/#{options[:sceance_id]}.asp"
  
  doc = Hpricot(open(sceance_url))
  
  intervention = 0
  inter_path = "a[name=INTER_#{intervention}]"
  # Fetch <a name="INTER_#{intervention}"/>
  while inter = doc.at(inter_path)
    
    word_count = 0
    
    # Fetch speaking deputy or minister
    speaker = inter.next
    if deputy_link = speaker.at("a")[href]
      deputy_id = deputy_link.slice(/(\d+).asp/, 1)
    else
      deputy_name = speaker.inner_html
    end
    
    # Fetch his/her first work count
    inter.following_siblings.each { |speech| word_count += speech.inner_text  }
    
    # Fetch parent and go until next a[name=INTER_
    
    
    # Go fetch next intervention
    intervention += 1
    inter_path = "a[name=INTER_#{intervention}]"
  end
end


# http://www.assemblee-nationale.fr/13/cri/2008-2009/20090190.asp#INTER_29
scance = parse_sceance(:sceance_id => 20090190)

deputies.sort{|a,b| b[1]<=>a[1]}.each { |elem|
  #puts "#{elem[1]}, <a href='http://www.assemblee-nationale.fr/13/tribun/fiches_id/#{elem[0]}.asp'>#{deputy_name(elem[0])}</a> - Place: #{deputy_seat(elem[0])}"
  puts "#{elem[1]}, #{deputy_seat(elem[0])}"
}


