import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RyanairService } from './ryanair.service';
import { Airport, AirportSelectable, Fare, Filter, Flight, SortBy, TimeTable } from './models';
import { PrimeNGConfig } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';
import { ProgressBarModule } from 'primeng/progressbar';
// For dynamic progressbar demo
import { ToastModule } from 'primeng/toast';
import { PanelModule } from 'primeng/panel';
import { CardModule } from 'primeng/card';
import { CommonModule, DatePipe } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { SliderModule } from 'primeng/slider';
import { TabViewModule } from 'primeng/tabview';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TimePipe } from './time.pipe';
import { StorageService } from './storage.service';


const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;


const FILTER_KEY = "ryan-filter";
const DESTINATION_KEY = "ryan-destinations";
const ORIGIN_KEY = "ryan-origin";
const TIMETABLE_KEY = "ryan-timetable";


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ButtonModule,
    DropdownModule,
    FormsModule,
    ToggleButtonModule,
    CheckboxModule,
    CalendarModule,
    ProgressBarModule,
    ToastModule,
    PanelModule,
    CardModule,
    DatePipe,
    CommonModule,
    AccordionModule,
    SliderModule,
    TabViewModule,
    SelectButtonModule,
    TimePipe
  ],
  providers: [
    BrowserModule,
    BrowserAnimationsModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'ryanair';

  origin!: Airport;
  destination!: Airport;

  startDate: Date[] | undefined;
  endDate: Date[] | undefined;

  airports: Airport[] = [];
  connected = false;
  commonDestinations: AirportSelectable[] = [];
  selectedDestinations: AirportSelectable[] = [];

  connectionVerified = false;

  oneWay = false;

  goFlights: Flight[] = [];
  returnFlights: Flight[] = [];
  filteredGoFlights: Flight[] = [];
  filteredReturnFlights: Flight[] = [];

  loading = false;
  searched = false;

  activeFilters: string = '';

  filterLength = 24;
  filterWaitTime: number[] = [0, 15];
  filterMaxPrice = 1000;

  sortBy: SortBy = SortBy.PRICE;
  sortByOptions = Object.values(SortBy);

  constructor(
    private ryanairService: RyanairService,
    private primengConfig: PrimeNGConfig,
    private storageService: StorageService
  ) {
  }

  async ngOnInit() {
    this.airports = await this.ryanairService.getAirports() || [];
    this.primengConfig.ripple = true;


    const origin = this.storageService.getItem(ORIGIN_KEY)
    if (origin) {
      this.origin = JSON.parse(origin);
    }

    const destination = this.storageService.getItem(DESTINATION_KEY)
    if (destination) {
      this.destination = JSON.parse(destination);
    }

    const filter = this.storageService.getItem(FILTER_KEY)
    if (filter) {
      const { length, waitTime, maxPrice, sortBy } = JSON.parse(filter);
      this.filterLength = length;
      this.filterWaitTime = waitTime;
      this.filterMaxPrice = maxPrice;
      this.sortBy = sortBy;
    }

    const timetable = this.storageService.getItem(TIMETABLE_KEY)
    if (timetable) {
      const { departure, arrival, oneWay } = JSON.parse(timetable);
      this.startDate = departure.map((x: any) => new Date(x)) || [];
      this.endDate = arrival.map((x: any) => new Date(x)) || [];
      this.oneWay = oneWay;

    }


  }

  changeOriginOrDestination() {
    this.connected = false;
    this.connectionVerified = false;
    this.searched = false;

    this.storageService.setItem(ORIGIN_KEY, JSON.stringify(this.origin));
    this.storageService.setItem(DESTINATION_KEY, JSON.stringify(this.destination));
  }

  async confirmAirports() {
    this.connected = await this.ryanairService.areAirportsConnected(this.origin, this.destination);
    if (!this.connected) {
      this.commonDestinations = (await this.ryanairService.getCommonDestinations(this.origin, this.destination)).map(a => ({ ...a, selected: true }));
    }
    this.connectionVerified = true;
    this.selectedDestinations = this.commonDestinations.filter(a => a.selected);
  }

  async searchFlights() {
    if (this.startDate?.length && (this.endDate?.length || this.oneWay)) {
      this.loading = true;
      this.goFlights = await this.ryanairService.getFlights(this.origin, this.destination, this.connected ? [] : this.selectedDestinations, this.startDate);
      console.log("------- ~ AppComponent ~ searchFlights ~ this.goFlights:", this.goFlights);
      if (!this.oneWay && this.endDate?.length) {
        this.returnFlights = await this.ryanairService.getFlights(this.destination, this.origin, this.connected ? [] : this.selectedDestinations, this.endDate);
        console.log("------- ~ AppComponent ~ searchFlights ~ this.returnFlights :", this.returnFlights);
      }
      this.filterFlights();
      this.loading = false;
      this.searched = true;
    }
  }

  changeSelectedDestinations() {
    this.selectedDestinations = this.commonDestinations.filter(a => a.selected);
  }

  changeDatesOrOneway() {
    this.searched = false;
    this.storageService.setItem(TIMETABLE_KEY, JSON.stringify({
      departure: this.startDate,
      arrival: this.endDate,
      oneWay: this.oneWay
    } as TimeTable));

  }

  priceOfFlight(flight: Flight): number {
    return flight.fareFirst.price.value + (flight.direct ? 0 : flight.fareLast.price.value);
  }

  timeOfFlightHours(flight: Flight): number {
    return (new Date(flight.fareLast.arrivalDate).getTime() - new Date(flight.fareFirst.departureDate).getTime()) / ONE_HOUR;
  }

  timeOfWaitHours(flight: Flight): number {
    return (new Date(flight.fareLast.departureDate).getTime() - new Date(flight.fareFirst.arrivalDate).getTime()) / ONE_HOUR;
  }

  durationOfFare(fare: Fare): string {
    const duration = (new Date(fare.arrivalDate).getTime() - new Date(fare.departureDate).getTime()) / ONE_MINUTE;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  }

  filterFlights() {
    this.filteredGoFlights = this.applyFilters(this.goFlights);
    if (this.oneWay) return;
    this.filteredReturnFlights = this.applyFilters(this.returnFlights);

    this.storageService.setItem(FILTER_KEY, JSON.stringify(
      {
        length: this.filterLength,
        waitTime: this.filterWaitTime,
        maxPrice: this.filterMaxPrice,
        sortBy: this.sortBy
      } as Filter
    ));
  }

  applyFilters(flights: Flight[]): Flight[] {
    this.activeFilters = `max ${this.filterLength}h, scalo ${this.filterWaitTime[0]}-${this.filterWaitTime[1]}h, max ${this.filterMaxPrice} €`;
    const byLength = flights.filter(f => (new Date(f.fareLast.arrivalDate).getTime() - new Date(f.fareFirst.departureDate).getTime()) < this.filterLength * ONE_HOUR);
    const waitTime = (f: Flight) => (new Date(f.fareLast.departureDate).getTime() - new Date(f.fareFirst.arrivalDate).getTime());
    const byWaitAndLength = byLength.filter(f => f.direct || (waitTime(f) >= this.filterWaitTime[0] * ONE_HOUR && waitTime(f) <= this.filterWaitTime[1] * ONE_HOUR));
    const byPriceAndWaitAndLength = byWaitAndLength.filter(f => this.priceOfFlight(f) <= this.filterMaxPrice);
    switch (this.sortBy) {
      case SortBy.PRICE:
        return byPriceAndWaitAndLength.sort((a, b) => this.priceOfFlight(a) - this.priceOfFlight(b));
      case SortBy.DURATION:
        return byPriceAndWaitAndLength.sort((a, b) => (new Date(a.fareLast.arrivalDate).getTime() - new Date(a.fareFirst.departureDate).getTime()) - (new Date(b.fareLast.arrivalDate).getTime() - new Date(b.fareFirst.departureDate).getTime()));
      // case SortBy.WAITING_TIME:
      //     return byPriceAndWaitAndLength.sort((a, b) => waitTime(a) - waitTime(b));
      case SortBy.DATE:
        return byPriceAndWaitAndLength.sort((a, b) => new Date(a.fareFirst.departureDate).getTime() - new Date(b.fareFirst.departureDate).getTime());
    }
  }
}




