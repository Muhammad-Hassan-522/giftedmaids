import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import emailjs from '@emailjs/browser';
import { environment } from '../../../environments/environment';

// Google API Client Loader
declare const gapi: any;
declare const google: any;

@Component({
  selector: 'app-book',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css'],
})
export class BookingComponent implements OnInit, AfterViewInit {
  // User selections
  selectedPackage: string | null = 'Cleaning Services';
  selectedType: string | null = null;
  selectedHomeSize: string | null = null;
  selectedFrequency: string | null = null;
  selectedAddOns: string[] = [];
  instructions = '';
  selectedDate = '';
  selectedTime = '';
  address = '';
  lat: number | null = null;
  lng: number | null = null;
  searchQuery = '';
  errorMessage = '';
  successMessage = '';

  // Error flags
  showTypeError = false;
  showHomeSizeError = false;
  showDateError = false;
  showTimeError = false;

  private map: any;
  private marker: any;

  packages = [
    {
      name: 'Cleaning Services',
      description:
        'Choose between Standard, Deep, or Move-In/Move-Out cleaning types with flexible frequency options.',
      types: [
        {
          type: 'Standard Cleaning',
          description:
            'Includes dusting, vacuuming, mopping, kitchen and bathroom cleaning, and surface wipe-downs.',
          pricing: [
            {
              homeSize: '1 bed / 1 bath / 1 kitchen / 1 dining',
              prices: {
                '1 time and done': 189,
                '1x/month': 189,
                '2x/month': 185,
                '3x/month': 180,
                '4x/month': 170,
              },
            },
            {
              homeSize: '2 bed / 1 bath / 1 kitchen / 1 dining',
              prices: {
                '1 time and done': 215,
                '1x/month': 215,
                '2x/month': 212,
                '3x/month': 208,
                '4x/month': 195,
              },
            },
            {
              homeSize: '2 bed / 2 bath / 1 kitchen / 1 dining',
              prices: {
                '1 time and done': 245,
                '1x/month': 245,
                '2x/month': 241,
                '3x/month': 239,
                '4x/month': 225,
              },
            },
            {
              homeSize: '3 bed / 2 bath / 1 kitchen / 1 dining',
              prices: {
                '1 time and done': 280,
                '1x/month': 280,
                '2x/month': 276,
                '3x/month': 273,
                '4x/month': 260,
              },
            },
            {
              homeSize: '3 bed / 3 bath / 1 kitchen / 1 dining',
              prices: {
                '1 time and done': 320,
                '1x/month': 320,
                '2x/month': 317,
                '3x/month': 312,
                '4x/month': 299,
              },
            },
          ],
          addOns: [{ name: 'Inside & Outside of Fridge', price: 35 }],
        },
        {
          type: 'Deep Cleaning',
          description:
            'Includes all standard cleaning tasks plus baseboards, trim, doors, and detailed kitchen & bathroom cleaning.',
          pricing: [
            {
              homeSize: '1 bed / 1 bath / 1 kitchen / 1 dining',
              prices: { 'Base Rate': 214 },
            },
            { homeSize: '2 bed / 1 bath', prices: { 'Base Rate': 246 } },
            { homeSize: '2 bed / 2 bath', prices: { 'Base Rate': 283 } },
            { homeSize: '3 bed / 2 bath', prices: { 'Base Rate': 325 } },
            { homeSize: '3 bed / 3 bath', prices: { 'Base Rate': 374 } },
          ],
          addOns: [{ name: 'Inside & Outside of Fridge', price: 35 }],
        },
        {
          type: 'Move-In / Move-Out Cleaning',
          description:
            'Top-to-bottom cleaning including kitchen, bathrooms, floors, and baseboards. Cabinets cleaned only if empty.',
          pricing: [
            {
              homeSize: '1 bed / 1 bath / 1 kitchen / 1 dining',
              prices: {
                '1 time and done': 217,
                '1x/month': 217,
                '2x/month': 213,
                '3x/month': 208,
                '4x/month': 195,
              },
            },
            {
              homeSize: '2 bed / 1 bath / 1 kitchen / 1 dining',
              prices: {
                '1 time and done': 250,
                '1x/month': 250,
                '2x/month': 247,
                '3x/month': 242,
                '4x/month': 225,
              },
            },
            {
              homeSize: '2 bed / 2 bath / 1 kitchen / 1 dining',
              prices: {
                '1 time and done': 288,
                '1x/month': 288,
                '2x/month': 283,
                '3x/month': 279,
                '4x/month': 260,
              },
            },
            {
              homeSize: '3 bed / 2 bath / 1 kitchen / 1 dining',
              prices: {
                '1 time and done': 331,
                '1x/month': 331,
                '2x/month': 326,
                '3x/month': 321,
                '4x/month': 300,
              },
            },
            {
              homeSize: '3 bed / 3 bath / 1 kitchen / 1 dining',
              prices: {
                '1 time and done': 381,
                '1x/month': 381,
                '2x/month': 376,
                '3x/month': 370,
                '4x/month': 348,
              },
            },
          ],
          addOns: [{ name: 'Inside & Outside of Fridge', price: 35 }],
        },
      ],
    },
  ];

  // --- helpers ---
  get selectedPackageDetails() {
    return this.packages.find((p) => p.name === this.selectedPackage) || null;
  }

  get selectedTypeDetails() {
    if (!this.selectedPackageDetails || !this.selectedType) return null;
    return (
      this.selectedPackageDetails.types.find(
        (t) => t.type === this.selectedType
      ) || null
    );
  }

  get availableTypes(): string[] {
    return this.selectedPackageDetails
      ? this.selectedPackageDetails.types.map((t) => t.type)
      : [];
  }

  get availableHomeSizes(): string[] {
    const type = this.selectedTypeDetails;
    return type ? type.pricing.map((p) => p.homeSize) : [];
  }

  get availableFrequencies(): string[] {
    const type = this.selectedTypeDetails;
    if (!type || !this.selectedHomeSize) return [];
    const entry = type.pricing.find(
      (p) => p.homeSize === this.selectedHomeSize
    );
    if (!entry) return [];
    return Object.keys(entry.prices) as string[];
  }

  // compute base price (TypeScript-safe)
  private getBasePrice(): number {
    const type = this.selectedTypeDetails;
    if (!type || !this.selectedHomeSize) return 0;
    const entry = type.pricing.find(
      (p) => p.homeSize === this.selectedHomeSize
    );
    if (!entry) return 0;

    const prices = entry.prices as Record<string, number>;

    if (
      this.selectedFrequency &&
      prices[this.selectedFrequency] !== undefined
    ) {
      return prices[this.selectedFrequency];
    }

    if (prices['Base Rate'] !== undefined) return prices['Base Rate'];

    const firstKey = Object.keys(prices)[0];
    return prices[firstKey] || 0;
  }

  get totalPrice(): number {
    let total = this.getBasePrice();
    const type = this.selectedTypeDetails;
    if (type && type.addOns && this.selectedAddOns.length) {
      const selectedAddOnObjects = type.addOns.filter((a) =>
        this.selectedAddOns.includes(a.name)
      );
      total += selectedAddOnObjects.reduce((sum, a) => sum + a.price, 0);
    }
    return total;
  }

  // --- Lifecycle ---
  ngOnInit() {
    this.loadGoogleApi();

    const iconRetinaUrl =
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
    const iconUrl =
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    const shadowUrl =
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
    L.Marker.prototype.options.icon = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      shadowSize: [41, 41],
    });
  }

  ngAfterViewInit() {
    // Center map roughly on Connecticut
    this.map = L.map('map').setView([41.6, -72.7], 10);
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    ).addTo(this.map);

    this.map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      this.setMarker(lat, lng);
      await this.reverseGeocode(lat, lng);
    });
  }

  private async reverseGeocode(lat: number, lng: number) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
    );
    const data = await response.json();
    this.address = data.display_name || 'Unknown location';
  }

  async searchLocation() {
    if (!this.searchQuery.trim()) {
      alert('Please enter an area or address.');
      return;
    }
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        this.searchQuery
      )}&accept-language=en`
    );
    const results = await response.json();

    if (results.length > 0) {
      const { lat, lon } = results[0];
      this.setMarker(parseFloat(lat), parseFloat(lon));
      this.map.setView([lat, lon], 15);
      this.address = results[0].display_name;
    } else {
      alert('No results found.');
    }
  }

  private setMarker(lat: number, lng: number) {
    this.lat = lat;
    this.lng = lng;
    if (this.marker) this.marker.remove();
    this.marker = L.marker([lat, lng]).addTo(this.map);
  }

  toggleAddOn(addOnName: string) {
    if (this.selectedAddOns.includes(addOnName)) {
      this.selectedAddOns = this.selectedAddOns.filter((a) => a !== addOnName);
    } else {
      this.selectedAddOns.push(addOnName);
    }
  }

  // ---------------- VALIDATION ----------------
  validateBooking(): boolean {
    // Reset all error flags
    this.errorMessage = '';
    this.showTypeError = false;
    this.showHomeSizeError = false;
    this.showDateError = false;
    this.showTimeError = false;

    let valid = true;

    if (!this.selectedType) {
      this.showTypeError = true;
      valid = false;
    }
    if (!this.selectedHomeSize) {
      this.showHomeSizeError = true;
      valid = false;
    }
    if (!this.selectedDate) {
      this.showDateError = true;
      valid = false;
    }
    if (!this.selectedTime) {
      this.showTimeError = true;
      valid = false;
    }

    if (!valid) {
      this.errorMessage = 'Please fill all required fields.';
      return false;
    }

    // Additional date-time checks
    const selectedDateTime = new Date(
      `${this.selectedDate}T${this.selectedTime}`
    );
    const now = new Date();
    if (selectedDateTime < now) {
      this.errorMessage = 'You cannot select a past date or time.';
      return false;
    }

    const day = selectedDateTime.getDay();
    const hour = selectedDateTime.getHours();

    if (day === 6) {
      this.errorMessage = 'We are closed on Saturdays.';
      return false;
    }
    if (day === 5 && (hour < 8 || hour >= 16)) {
      this.errorMessage = 'Friday hours: 8 AM - 4 PM only.';
      return false;
    }
    if (day >= 0 && day <= 4 && (hour < 9 || hour >= 17)) {
      this.errorMessage = 'Sun-Thu hours: 9 AM - 5 PM only.';
      return false;
    }

    if (!this.address || this.address.trim().length < 5) {
      this.errorMessage = 'Please provide an address (manual or from map).';
      return false;
    }

    return true;
  }

  submitBooking() {
    if (!this.validateBooking()) return;

    const templateParams = {
      to_email: 'codebyhassann@gmail.com',
      package: this.selectedPackage,
      type: this.selectedType,
      homeSize: this.selectedHomeSize,
      frequency: this.selectedFrequency || 'Base Rate',
      addOns: this.selectedAddOns.join(', ') || 'None',
      date: this.selectedDate,
      time: this.selectedTime,
      total: this.totalPrice,
      address: this.address,
      instructions: this.instructions || 'None',
    };

    emailjs
      .send(
        environment.emailJS.serviceID,
        environment.emailJS.templates.booking.templateID,
        templateParams,
        environment.emailJS.publicKey
      )
      .then(async (response) => {
        if (response.status === 200) {
          await this.addEventToGoogleCalendar();
          this.successMessage =
            '✅ Booking submitted successfully! Event added to your Google Calendar.';
          this.errorMessage = '';
        } else {
          this.errorMessage = 'EmailJS failed to send booking.';
        }
      })
      .catch((err) => {
        console.error('EmailJS error:', err);
        this.errorMessage = 'Something went wrong while sending the booking.';
      });
  }

  // ---------------- Google Calendar ----------------
  private loadGoogleApi() {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapi.load('client:auth2', async () => {
        await gapi.client.init({
          apiKey: environment.google.apiKey,
          clientId: environment.google.clientId,
          scope: 'https://www.googleapis.com/auth/calendar.events',
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
          ],
        });
      });
    };
    document.body.appendChild(script);
  }

  private async addEventToGoogleCalendar() {
    try {
      await this.googleSignIn();

      const startDateTime = new Date(
        `${this.selectedDate}T${this.selectedTime}`
      );
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + 2); // 2-hour event

      const event = {
        summary: `Cleaning Booking: ${this.selectedType} - ${this.selectedHomeSize}`,
        location: this.address,
        description:
          `Type: ${this.selectedType}\n` +
          `Home Size: ${this.selectedHomeSize}\n` +
          `Frequency: ${this.selectedFrequency || 'Base Rate'}\n` +
          `Add-ons: ${this.selectedAddOns.join(', ') || 'None'}\n` +
          `Instructions: ${this.instructions || 'None'}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/New_York',
        },
      };

      await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });

      console.log("Event added to user's Google Calendar");
    } catch (err) {
      console.error(' Google Calendar error:', err);
      this.errorMessage = 'Google Calendar integration failed.';
    }
  }

  private async googleSignIn(): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: environment.google.clientId,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        callback: (response: any) => {
          if (response.error) return reject(response);
          gapi.client.setToken({ access_token: response.access_token });
          resolve();
        },
      });

      // Opens popup automatically
      client.requestAccessToken();
    });
  }

  openedPackage: string | null = null;
  togglePackage(pkgName: string) {
    this.openedPackage = this.openedPackage === pkgName ? null : pkgName;
  }
  clearMarker() {
    if (this.marker) this.marker.remove();
    this.lat = null;
    this.lng = null;
  }

  getAddOnPrice(addOnName: string): number {
    const type = this.selectedTypeDetails;
    if (!type || !type.addOns) return 0;
    const addOn = type.addOns.find((a) => a.name === addOnName);
    return addOn ? addOn.price : 0;
  }
}
