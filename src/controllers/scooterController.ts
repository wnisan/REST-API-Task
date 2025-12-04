import { Request, Response } from 'express';
import { Scooter, IScooter } from '../models/Scooter';
import { Driver } from '../models/Driver';

// Уровень 0: Один endpoint для всех операций
export const level0Handler = async (req: Request, res: Response): Promise<void> => {
    const { operation, data } = req.body;

    try {
        switch (operation) {
            case 'getAllScooters':
                const scooters = await Scooter.find();
                res.json(scooters);
                break;
            case 'createScooter':
                const newScooter = new Scooter(data);
                await newScooter.save();
                res.json(newScooter);
                break;

            case 'deleteScooter':
                await Scooter.findByIdAndDelete(data.id);
                res.json({ message: 'Scooter deleted' });
                break;

            default:
                res.status(400).json({ error: 'Unknown operation' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Уровни 1 + 2: RESTful endpoints с HTTP методами
// GET /scooters - получить все самокаты
export const getAllScooters = async (req: Request, res: Response): Promise<void> => {
    try {
        const scooters = await Scooter.find().populate('currentRun.driver bookingsHistory.driver');
        res.status(200).json(scooters);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch scooters' });
    }
};

// GET /scooters/:id - получить конкретный самокат
export const getScooterById = async (req: Request, res: Response): Promise<void> => {
    try {
        const scooter = await Scooter.findById(req.params.id).populate('currentRun.driver bookingsHistory.driver');

        if (!scooter) {
            res.status(404).json({ error: 'Scooter not found' });
            return;
        }

        res.status(200).json(scooter);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch scooter' });
    }
};

// POST /scooters - создать новый самокат
export const createScooter = async (req: Request, res: Response): Promise<void> => {
    try {
        const scooter = new Scooter(req.body);
        await scooter.save();
        res.status(201).json(scooter);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create scooter' });
    }
};

// PUT /scooters/:id - обновить самокат
export const updateScooter = async (req: Request, res: Response): Promise<void> => {
    try {
        const scooter = await Scooter.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!scooter) {
            res.status(404).json({ error: 'Scooter not found' });
            return;
        }

        res.status(200).json(scooter);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update scooter' });
    }
};

// DELETE /scooters/:id - удалить самокат
export const deleteScooter = async (req: Request, res: Response): Promise<void> => {
    try {
        const scooter = await Scooter.findByIdAndDelete(req.params.id);

        if (!scooter) {
            res.status(404).json({ error: 'Scooter not found' });
            return;
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete scooter' });
    }
};

// Уровень 3: HATEOAS - добавляем ссылки на связанные ресурсы
export const getScootersWithLinks = async (req: Request, res: Response): Promise<void> => {
    try {
        const scooters = await Scooter.find()
            .populate('currentRun.driver')
            .populate('bookingsHistory.driver');

        const scootersWithLinks = scooters.map(scooter => ({
            ...scooter.toObject(),
            _links: {
                self: { href: `/scooters/${scooter._id}` },
                driver: scooter.currentRun?.driver
                    ? { href: `/drivers/${scooter.currentRun.driver}` }
                    : null,
                bookings: { href: `/scooters/${scooter._id}/bookings` }
            }
        }));

        res.status(200).json({
            scooters: scootersWithLinks,
            _links: {
                create: { href: '/scooters', method: 'POST' },
                freeScooters: { href: '/scooters?status=Free' }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch scooters' });
    }
};

// Свободный самокат
export const getFreeScooters = async (req: Request, res: Response): Promise<void> => {
    try {
        const freeScooters = await Scooter.find({ status: 'Free', chargeLevel: { $gt: 20 } });
        res.status(200).json(freeScooters);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch free scooters' });
    }
};

// Начать поездку
export const startRide = async (req: Request, res: Response): Promise<void> => {
    try {
        const { scooterId, driverId } = req.body;

        const scooter = await Scooter.findById(scooterId);
        const driver = await Driver.findById(driverId);

        if (!scooter || !driver) {
            res.status(404).json({ error: 'Scooter or driver not found' });
            return;
        }

        if (scooter.status !== 'Free') {
            res.status(400).json({ error: 'Scooter is not available' });
            return;
        }

        // Обновляем самокат для начала поездки
        scooter.status = 'In use';
        scooter.currentRun = {
            startDate: new Date(),
            driver: driverId,
            startChargeLevel: scooter.chargeLevel,
            startMileage: 0
        };

        await scooter.save();
        res.status(200).json(scooter);
    } catch (error) {
        res.status(500).json({ error: 'Failed to start ride' });
    }
};