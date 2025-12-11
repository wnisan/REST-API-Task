import { Schema, model, Document, Types } from 'mongoose';

interface IBooking {
    startDate: Date;
    driver: Types.ObjectId;
    startChargeLevel: number;
    startMileage: number;
    finishChargeLevel?: number;
    finishMileage?: number;
}

export interface IScooter extends Document {
    ssn: string;  // Scooter Serial Number
    brand: string;
    modelName: string;
    productionDate: Date;
    status: 'Free' | 'Reserved' | 'In use' | 'Unavailable' | 'In Service';
    chargeLevel: number;
    currentRun?: IBooking;
    location: {
        type: string;
        coordinates: number[];
    };
    bookingsHistory: IBooking[];
}

const scooterSchema = new Schema<IScooter>({
    ssn: { type: String, required: true, unique: true },
    brand: { type: String, required: true },
    modelName: { type: String, required: true },
    productionDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['Free', 'Reserved', 'In use', 'Unavailable', 'In Service'],
        default: 'Free'
    },
    chargeLevel: { type: Number, min: 0, max: 100, default: 100 },
    currentRun: {
        startDate: Date,
        driver: { type: Schema.Types.ObjectId, ref: 'Driver' },
        startChargeLevel: Number,
        startMileage: Number
    },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },
    bookingsHistory: [{
        startDate: Date,
        driver: { type: Schema.Types.ObjectId, ref: 'Driver' },
        startChargeLevel: Number,
        startMileage: Number,
        finishChargeLevel: Number,
        finishMileage: Number
    }]
});

// индекс для геопоиска
scooterSchema.index({location: '2dsphere'}); // 2 метра

export const Scooter = model<IScooter>('Scooter', scooterSchema);