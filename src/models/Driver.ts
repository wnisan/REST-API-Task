import { Schema, model, Document } from 'mongoose';

export interface IDriver extends Document {
    firstName: string;
    lastName: string;
    card: {
        number: string;
        owner: string;
        validThrough: Date;
    };
}

const driverSchema = new Schema<IDriver>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    card: {
        number: { type: String, required: true },
        owner: { type: String, required: true },
        validThrough: { type: Date, required: true }
    }
});

export const Driver = model<IDriver>('Driver', driverSchema);