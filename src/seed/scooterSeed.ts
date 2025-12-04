import { Scooter } from "../models/Scooter";
import { Driver } from "../models/Driver";

declare global {
    var seedDrivers: any[];
}

export const seedScooters = async () => {
    const scooterCount = await Scooter.countDocuments();
    const driverCount = await Driver.countDocuments();

    const createdDrivers = await Driver.insertMany([
        {
            firstName: "Иван",
            lastName: "Петров",
            email: "ivan.petrov@example.com",
            phone: "+79991234567",
            card: {
                owner: "Иван Петров",
                number: "4111111111111111",
                validThrough: new Date("2028-12-01"),
                cvv: "123"
            }
        },
        {
            firstName: "Мария",
            lastName: "Смирнова",
            email: "maria.smirnova@example.com",
            phone: "+79995554433",
            card: {
                owner: "Мария Смирнова",
                number: "4000000000000002",
                validThrough: new Date("2027-09-01"),
                cvv: "456"
            }
        }
    ]);

    globalThis.seedDrivers = createdDrivers;

    // Если самокаты уже есть — не создаём
    if (scooterCount > 0) {
        console.log("Seed: scooters already exist — skip seeding.");
        return;
    }

    const [driver1, driver2] = globalThis.seedDrivers;

    const seedData = [
        {
            ssn: "SCT-001",
            brand: "Xiaomi",
            modelName: "Mi Pro 2",
            productionDate: "2022-01-10",
            status: "Free",
            chargeLevel: 87,
            mileage: 152.4,
            startChargeLevel: 87,
            startMileage: 152.4,
            location: {
                type: "Point",
                coordinates: [37.6173, 55.7558]
            }
        },

        {
            ssn: "SCT-002",
            brand: "Kugoo",
            modelName: "M4 Pro",
            productionDate: "2023-03-15",
            status: "In Service",
            chargeLevel: 45,
            mileage: 312.8,
            startChargeLevel: 45,
            startMileage: 312.8,
            driverId: driver1._id,      
            location: {
                type: "Point",
                coordinates: [30.3141, 59.9386]
            }
        },

        {
            ssn: "SCT-003",
            brand: "Ninebot",
            modelName: "Max G30",
            productionDate: "2021-09-01",
            status: "Reserved",
            chargeLevel: 66,
            mileage: 98.1,
            startChargeLevel: 66,
            startMileage: 98.1,
            driverId: driver2._id,       
            location: {
                type: "Point",
                coordinates: [49.1234, 53.1959]
            }
        }
    ];

    await Scooter.insertMany(seedData);
};
