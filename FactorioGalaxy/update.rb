require 'nokogiri'
require 'json'
require 'open-uri'


doc = Nokogiri::HTML.parse(URI.open("https://www.factorio.com/galaxy"))

tags = doc.xpath("//script")

trigger = "initSpacemapViewer("
text = tags[6].text
idx= text.index(trigger)+trigger.length
blob = text[idx..-1].strip
doc = JSON.parse(blob[0..-5])
users = doc['stars']['users']
puts "Parsed #{users.count} users"
puts "here's a random one: #{users[rand(users.length)]}"

File.open("stars.json", 'w') do |f|
  f.write(doc.to_json)
end




