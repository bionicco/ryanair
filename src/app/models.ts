export interface Airport {
    "code": string;
    "name": string;
    "seoName": string;
    "aliases": [];
    "base": false;
    "city": {
        "name": string;
        "code": string
    };
    "region": {
        "name": string;
        "code": string
    };
    "macCity": {
        "name": string;
        "code": string;
        "macCode": string;
    };
    "country": {
        "code": string;
        "iso3code": string;
        "name": string;
        "currency": string;
        "defaultAirportCode": string;
        "schengen": true
    };
    "coordinates": {
        "latitude": 57.0534;
        "longitude": 9.5057
    };
    "timeZone": string
}

export interface AirportSelectable extends Airport {
    selected: boolean,
}

export type Destination = {
    airportCode: string;
    airports: Airport[];
}

export type Schedule = {
    [key: string]: {
        "firstFlightDate": string,
        "lastFlightDate": string,
        "months": number,
        "monthsFromToday": number
    },
}

export type Fare = {
    "day": string,
    "arrivalDate": Date,
    "departureDate": Date,
    "price": {
        "value": number,
        "valueMainUnit": string,
        "valueFractionalUnit": string,
        "currencyCode": string,
        "currencySymbol": string,
    },
    "soldOut": boolean,
    "unavailable": boolean
}

export type Flight = {
    startAirport: Airport,
    middleAirport?: Airport,
    endAirport: Airport,
    direct: boolean,
    fareFirst: Fare,
    fareLast: Fare,
}

export enum SortBy {
    PRICE = 'Prezzo',
    DURATION = 'Durata',
    // WAITING_TIME = 'Durata scalo',
    DATE = 'Data'
}