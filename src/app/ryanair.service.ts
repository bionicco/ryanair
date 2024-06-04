import { Injectable } from '@angular/core';
import { Airport, Destination, Fare, Flight, Schedule } from './models';

const ONE_DAY = 24 * 60 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class RyanairService {

  private airports: Airport[] = [];

  private destinations: Destination[] = [];

  constructor() {

  }

  public async getAirports(): Promise<Airport[]> {
    if (!this.airports.length) {
      const resp = await fetch('https://www.ryanair.com/api/views/locate/5/airports/en/active');
      this.airports = await resp.json();
    }
    return this.airports;

    //https://www.ryanair.com/api/views/locate/5/airports/en/active
  }

  public async getDestinations(airport: Airport): Promise<Airport[]> {
    const destination = this.destinations.find(d => d.airportCode === airport.code);
    if (destination) {
      return destination.airports;
    }
    else {
      const resp = await fetch(`https://www.ryanair.com/api/views/locate/searchWidget/routes/en/airport/${airport.code}`);
      const airports = (await resp.json()).map((a: any) => a.arrivalAirport);
      this.destinations.push({ airportCode: airport.code, airports });
      return airports;
    }
  }

  public async getAirportByCode(code: string): Promise<Airport | undefined> {
    const airports = await this.getAirports();
    return airports?.length ? airports.find(a => a.code === code) : undefined;
  }

  public async getAirportSchedule(airport: Airport,): Promise<Schedule[]> {
    const resp = await fetch(`https://www.ryanair.com/api/timtbl/3/schedules/${airport.code}/periods`);
    return await resp.json();
  }

  public async getFares(origin: string, destination: string, date: Date, currency: string = 'EUR'): Promise<Fare[]> {
    const departDate = date.toISOString().split('T')[0];
    const resp = await fetch(`https://www.ryanair.com/api/farfnd/v4/oneWayFares/${origin}/${destination}/cheapestPerDay?outboundMonthOfDate=${departDate}&currency=${currency}`);
    return (await resp.json()).outbound.fares;
  }

  public async getCommonDestinations(origin: Airport, destination: Airport): Promise<Airport[]> {
    const originDestinations = await this.getDestinations(origin);
    const destinationDestinations = await this.getDestinations(destination);
    return originDestinations.filter(o => destinationDestinations.some(d => d.code === o.code));
  }

  public async areAirportsConnected(origin: Airport, destination: Airport): Promise<boolean> {
    const destinations = await this.getDestinations(origin);
    return destinations.some(d => d.code === destination.code);
  }

  public async getFlights(origin: Airport, destination: Airport, commonDestinations: Airport[], dateInterval: Date[]): Promise<Flight[]> {
    const flights: Flight[] = [];
    if (!commonDestinations?.length) {
      const fares = await this.getFares(origin.code, destination.code, dateInterval[0]);
      for (const fare of fares) {
        if (fare.soldOut || fare.unavailable) continue;
        if (fare.departureDate < dateInterval[0] || fare.departureDate > dateInterval[1]) continue;
        flights.push({
          startAirport: origin,
          middleAirport: undefined,
          endAirport: destination,
          fareFirst: fare,
          fareLast: fare,
          direct: true
        });
      }
    } else {
      for (const commonDestination of commonDestinations) {
        const faresStart = await this.getFares(origin.code, commonDestination.code, dateInterval[0]);
        const faresEnd = await this.getFares(commonDestination.code, destination.code, dateInterval[0]);
        for (const fareStart of faresStart) {
          if (fareStart.soldOut || fareStart.unavailable) continue;
          if (fareStart.departureDate < dateInterval[0] || fareStart.departureDate > dateInterval[1]) continue;
          for (const fareEnd of faresEnd) {
            if (fareEnd.soldOut || fareEnd.unavailable) continue;
            if (fareEnd.departureDate < dateInterval[0] || fareEnd.departureDate > dateInterval[1]) continue;
            if (fareEnd.departureDate < fareStart.arrivalDate) continue;
            flights.push({
              startAirport: origin,
              middleAirport: commonDestination,
              endAirport: destination,
              fareFirst: fareStart,
              fareLast: fareEnd,
              direct: false
            });
            break;
          }
        }
      }
    }
    return flights;
  }



}
