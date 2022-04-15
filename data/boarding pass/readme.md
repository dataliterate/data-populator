# Boarding Pass

## Tags
Travel, Itinerary, Mobility, Documents, Airplane, Airport, Flight, Traffic, Air Traffic

## Description
While working on the next generation of [Data Populator](http://www.datapopulator.com), which has been released on October 15th in Los Angeles, I wanted to create a new demo example and the d data set. As I was currently booking my flight to LA, I came across the idea of using a generic Boarding Pass template. There are so many slightly different Board Pass designs out there, all resembling each other a lot, though always being different in the details. I think it showcases the need to work with realistic and meaningful data quite well, as Boarding Passes are usually optimized for mobile devices and need to display quite a lot of information that needs to be graspable on a glimpse.

I also wanted to explore the process of creating such dataset from scratch – as this is one of the major question many Data Populator users are asking us: "The demo data isn't enough and I don't have a live API with real data yet. I hate Lorem Ipsum though, where can I find realistic and meaningful mock data for my design mockups?". As I love [mockaroo.com](https://www.mockaroo.com) for its very wide and flexible offering, this is where I went. It has a lot of limitations though, being mainly focused on text based mock data (and of course, there could be way more data sets for so many more topics!). But as they let you extend their 'Data Schemes' with custom CSV and you can also use 'Template' fields in which you can use URLs in combination with variables coming from other fields, there's a lot of possibility here. So for example, this is how the URL for an Airline logo looks like: `https://www.gstatic.com/flights/airline_logos/70px/{airline.code}.png` – so if you replace {airline.code} with eg. 'LH', you'll get the [image](https://www.gstatic.com/flights/airline_logos/70px/LH.png) that is being used by [Google Flights](https://www.google.com/flights).

**'Boarding Pass' Schema on mockaroo.com**  
https://www.mockaroo.com/854ad870

**'Boarding Pass' Mock API on mockaroo.com**  
https://my.api.mockaroo.com/boardingpass.json?key=aa343f30

## Content

**Data Set**  
[boardingpass.json](boardingpass.json)

**Demo Mockups**  
[boardingpass.xd](boardingpass.xd)  
[boardingpass.sketch](boardingpass.sketch)

**Custom CSV**  
[boardingpass-labels.csv](boardingpass-labels.csv)  
[airports.csv](airports.csv)  
[airlines.csv](airlines.csv)

## Author
Christophe Stoll of [Data Literate](http://www.dataliterate.de), makers of [Data Populator](http://www.datapopulator.com)

## Data Sources & Credits
https://www.mockaroo.com  
https://www.google.com/flights  
https://www.countryflags.io  
http://goqr.me/api/  
https://github.com/beanumber/airlines  
https://github.com/jpatokal/openflights
