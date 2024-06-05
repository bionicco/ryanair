# Ryanair

This is a simple tool to find the Ryanair flights from one city to another. It uses Ryanair's API to get the prices and the routes.
It's been made because it's not easy with Ryanair's website to find a connection between two airports that aren't directly connected and with this tool you can easily create an itinerary with multiple flights.

## Technologies

This is an Angular project, using PrimeNG for the UI components.
It's a fast written project, so it's not perfect (well..the code is pretty ugly), but it works.
The UI is in italian, but it's easy to change it.Ask me if you need  translation and I can insert it in the project

## API

The use of Ryanair API isn't documented, (and I'm not sure if it's allowed), so maybe it will stop working in the future.
Because it's not documented, I had to do some reverse engineering to understand how it works, so it's not perfect and may it will exclude some flights.
If someone knows how to use API in a better way, please let me know.

## Installation and use

Just clone the repository , run `npm install` and test it with `ng serve`.