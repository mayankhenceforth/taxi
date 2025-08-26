export class UpdateUserDto {
  name?: string;

  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}