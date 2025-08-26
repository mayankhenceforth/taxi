import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GeocodingService {
  constructor(private readonly configService: ConfigService) {}

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const response = await axios.get(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${this.configService.get<string>('GEOAPIFY_API_KEY')}`
      );
      return response.data.features[0]?.properties?.formatted || 'N/A';
    } catch (error) {
      console.warn('Reverse geocoding failed:', error.message);
      return 'N/A';
    }
  }
}