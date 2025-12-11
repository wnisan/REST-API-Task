import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Scooter } from '../models/Scooter';
import { Driver } from '../models/Driver';
import {
    handleMongooseError,
    isDuplicateKeyError
} from '../utils/errorHandler';

// УРОВЕНЬ 0 
export const level0Handler = async (req: Request, res: Response): Promise<void> => {
    const { operation, data } = req.body;

    if (!operation) {
        res.status(400).json({
            message: 'Не указана операция.'
        });
        return;
    }

    try {
        switch (operation) {
            case 'getAllScooters':
                const scooters = await Scooter.find();
                res.json(scooters);
                break;

            case 'createScooter':
                if (!data || typeof data !== 'object') {
                    res.status(400).json({
                        message: 'Нужен объект "data" с полями.'
                    });
                    break;
                }

                const newScooter = new Scooter(data);
                await newScooter.save();
                res.json(newScooter);
                break;

            case 'deleteScooter':
                if (!data?.id) {
                    res.status(400).json({
                        message: 'Нужен data.id для удаления.'
                    });
                    break;
                }

                const deleted = await Scooter.findByIdAndDelete(data.id);
                if (!deleted) {
                    res.status(404).json({
                        message: 'Самокат не найден.'
                    });
                    break;
                }

                res.json({ message: 'Самокат удален.' });
                break;

            default:
                res.status(400).json({
                    message: 'Некорректная операция.'
                });
        }
    } catch (error: any) {
        console.error('Ошибка в level0Handler:', error);

        const handled = handleMongooseError(res, error);
        if (!handled) {
            res.status(500).json({
                message: 'Ошибка сервера.'
            });
        }
    }
};

// УРОВНИ 1-2 (REST) 

// GET /scooters
export const getAllScooters = async (req: Request, res: Response): Promise<void> => {
    try {
        const scooters = await Scooter.find().populate('currentRun.driver bookingsHistory.driver');
        res.status(200).json(scooters);
    } catch (error: any) {
        console.error('Ошибка при получении самокатов:', error);
        res.status(500).json({
            message: 'Ошибка сервера.'
        });
    }
};

// GET /scooters/:id
export const getScooterById = async (req: Request, res: Response): Promise<void> => {
    try {
        const scooter = await Scooter.findById(req.params.id)
            .populate('currentRun.driver bookingsHistory.driver');

        if (!scooter) {
            res.status(404).json({
                message: 'Самокат не найден.'
            });
            return;
        }

        res.status(200).json(scooter);
    } catch (error: any) {
        console.error('Ошибка при получении самоката:', error);

        if (error?.name === 'CastError') {
            res.status(400).json({
                message: 'Некорректный ID.'
            });
            return;
        }

        res.status(500).json({
            message: 'Ошибка сервера.'
        });
    }
};

// POST /scooters
export const createScooter = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    try {
        const scooter = new Scooter(req.body);
        await scooter.save();
        res.status(201).json(scooter);
    } catch (error: any) {
        console.error('Ошибка при создании самоката:', error);

        const handled = handleMongooseError(res, error);
        if (!handled) {
            res.status(500).json({
                message: 'Ошибка сервера.'
            });
        }
    }
};

// PUT /scooters/:id
export const updateScooter = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    try {
        if (!Object.keys(req.body || {}).length) {
            res.status(400).json({
                message: 'Нужно хотя бы одно поле для обновления.'
            });
            return;
        }

        const scooter = await Scooter.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!scooter) {
            res.status(404).json({
                message: 'Самокат не найден.'
            });
            return;
        }

        res.status(200).json(scooter);
    } catch (error: any) {
        console.error('Ошибка при обновлении:', error);

        const handled = handleMongooseError(res, error);
        if (!handled) {
            res.status(500).json({
                message: 'Ошибка сервера.'
            });
        }
    }
};

// DELETE /scooters/:id
export const deleteScooter = async (req: Request, res: Response): Promise<void> => {
    try {
        const scooter = await Scooter.findByIdAndDelete(req.params.id);

        if (!scooter) {
            res.status(404).json({
                message: 'Самокат не найден.'
            });
            return;
        }

        res.status(204).send();
    } catch (error: any) {
        console.error('Ошибка при удалении:', error);

        if (error?.name === 'CastError') {
            res.status(400).json({
                message: 'Некорректный ID.'
            });
            return;
        }

        res.status(500).json({
            message: 'Ошибка сервера.'
        });
    }
};

// УРОВЕНЬ 3 (HATEOAS) 

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
    } catch (error: any) {
        console.error('Ошибка HATEOAS:', error);
        res.status(500).json({
            message: 'Ошибка сервера.'
        });
    }
};

// GET /scooters/free
export const getFreeScooters = async (req: Request, res: Response): Promise<void> => {
    try {
        const freeScooters = await Scooter.find({
            status: 'Free',
            chargeLevel: { $gt: 20 }
        });
        res.status(200).json(freeScooters);
    } catch (error: any) {
        console.error('Ошибка при получении свободных самокатов:', error);
        res.status(500).json({
            message: 'Ошибка сервера.'
        });
    }
};

// POST /rides/start
export const startRide = async (req: Request, res: Response): Promise<void> => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    try {
        const { scooterId, driverId } = req.body;
        const scooter = await Scooter.findById(scooterId);
        const driver = await Driver.findById(driverId);

        if (!scooter || !driver) {
            res.status(404).json({
                message: 'Самокат или водитель не найден.'
            });
            return;
        }

        if (scooter.status !== 'Free') {
            res.status(400).json({
                message: 'Самокат занят.'
            });
            return;
        }

        scooter.status = 'In use';
        scooter.currentRun = {
            startDate: new Date(),
            driver: driverId,
            startChargeLevel: scooter.chargeLevel,
            startMileage: 0
        };

        await scooter.save();
        res.status(200).json(scooter);

    } catch (error: any) {
        console.error('Ошибка при начале поездки:', error);

        if (error?.name === 'CastError') {
            res.status(400).json({
                message: 'Некорректный ID.'
            });
            return;
        }

        res.status(500).json({
            message: 'Ошибка сервера.'
        });
    }
};