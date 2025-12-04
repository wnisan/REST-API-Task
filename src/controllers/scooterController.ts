import { Request, Response } from 'express';
import { Scooter } from '../models/Scooter';
import { Driver } from '../models/Driver';

// Вспомогательная функция: проверка на дубликат 
const isDuplicateKeyError = (error: any): boolean =>
    !!error && (error.code === 11000 || error.code === 11001);

const handleScooterDuplicateError = (res: Response, error: any): void => {
    if (isDuplicateKeyError(error)) {
        const fieldNames = Object.keys(error.keyPattern || {});
        const field = fieldNames[0] || 'ssn';

        res.status(409).json({
            message: 'Самокат с таким значением уже существует.',
            details: `Поле "${field}" должно быть уникальным. Укажите другое значение.`
        });
    }
};

// Уровень 0: Один endpoint для всех операций
export const level0Handler = async (req: Request, res: Response): Promise<void> => {
    const { operation, data } = req.body;

    if (!operation) {
        res.status(400).json({
            message: 'Не указана операция. В теле запроса должно быть поле "operation".'
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
                        message: 'Для создания самоката нужно передать объект "data" с его полями.'
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
                        message: 'Для удаления самоката необходимо указать его идентификатор в поле "data.id".'
                    });
                    break;
                }

                try {
                    const deleted = await Scooter.findByIdAndDelete(data.id);

                    if (!deleted) {
                        res.status(404).json({
                            message: 'Самокат с указанным идентификатором не найден. Возможно, он уже был удалён.'
                        });
                        break;
                    }

                    res.json({ message: 'Самокат успешно удалён.' });
                } catch (error: any) {
                    console.error('Ошибка при удалении самоката через level0Handler:', error);

                    if (error?.name === 'CastError') {
                        res.status(400).json({
                            message: 'Некорректный формат идентификатора самоката. Используйте корректный ObjectId.'
                        });
                        break;
                    }

                    res.status(500).json({
                        message: 'Не удалось удалить самокат из-за внутренней ошибки сервера.'
                    });
                }
                break;

            default:
                res.status(400).json({
                    message: 'Некорректная операция. Поле \"operation\" должно содержать одно из значений: getAllScooters, createScooter, deleteScooter.'
                });
        }
    } catch (error: any) {
        console.error('Ошибка в level0Handler:', error);

        if (isDuplicateKeyError(error)) {
            handleScooterDuplicateError(res, error);
            return;
        }

        if (error?.name === 'ValidationError') {
            const fields = Object.keys(error.errors || {});
            res.status(400).json({
                message: 'Некорректные данные. Проверьте правильность заполнения полей.',
                details: fields.length ? `Проблемные поля: ${fields.join(', ')}` : undefined
            });
            return;
        }

        res.status(500).json({
            message: 'На сервере произошла непредвиденная ошибка. Попробуйте повторить запрос позже.'
        });
    }
};

// Уровни 1 + 2: RESTful endpoints с HTTP методами
// GET /scooters - получить все самокаты
export const getAllScooters = async (req: Request, res: Response): Promise<void> => {
    try {
        const scooters = await Scooter.find().populate('currentRun.driver bookingsHistory.driver');
        res.status(200).json(scooters);
    } catch (error: any) {
        console.error('Ошибка при получении списка самокатов:', error);
        res.status(500).json({
            message: 'Не удалось получить список самокатов. Попробуйте позже.'
        });
    }
};

// GET /scooters/:id - получить конкретный самокат
export const getScooterById = async (req: Request, res: Response): Promise<void> => {
    try {
        const scooter = await Scooter.findById(req.params.id).populate('currentRun.driver bookingsHistory.driver');

        if (!scooter) {
            res.status(404).json({
                message: 'Самокат с указанным идентификатором не найден. Проверьте правильность id.'
            });
            return;
        }

        res.status(200).json(scooter);
    } catch (error: any) {
        console.error('Ошибка при получении самоката по id:', error);

        if (error?.name === 'CastError') {
            res.status(400).json({
                message: 'Некорректный формат идентификатора самоката. Используйте корректный ObjectId.'
            });
            return;
        }

        res.status(500).json({
            message: 'Не удалось получить данные самоката. Попробуйте позже.'
        });
    }
};

// POST /scooters - создать новый самокат
export const createScooter = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ssn, brand, modelName, productionDate } = req.body || {};

        const missingFields: string[] = [];
        if (!ssn) missingFields.push('ssn');
        if (!brand) missingFields.push('brand');
        if (!modelName) missingFields.push('modelName');
        if (!productionDate) missingFields.push('productionDate');

        if (missingFields.length) {
            res.status(400).json({
                message: 'Отсутствуют обязательные поля для создания самоката.',
                details: `Необходимо указать: ${missingFields.join(', ')}.`
            });
            return;
        }

        const scooter = new Scooter(req.body);
        await scooter.save();
        res.status(201).json(scooter);
    } catch (error: any) {
        console.error('Ошибка при создании самоката:', error);

        if (isDuplicateKeyError(error)) {
            handleScooterDuplicateError(res, error);
            return;
        }

        if (error?.name === 'ValidationError') {
            const fields = Object.keys(error.errors || {});
            res.status(400).json({
                message: 'Некорректные данные для создания самоката. Проверьте обязательные поля.',
                details: fields.length ? `Проблемные поля: ${fields.join(', ')}` : undefined
            });
            return;
        }

        res.status(500).json({
            message: 'Не удалось создать самокат из-за ошибки на сервере. Попробуйте позже.'
        });
    }
};

// PUT /scooters/:id - обновить самокат
export const updateScooter = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!Object.keys(req.body || {}).length) {
            res.status(400).json({
                message: 'Для обновления самоката необходимо передать хотя бы одно поле в теле запроса.'
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
                message: 'Самокат с указанным идентификатором не найден. Обновление невозможно.'
            });
            return;
        }

        res.status(200).json(scooter);
    } catch (error: any) {
        console.error('Ошибка при обновлении самоката:', error);

        if (isDuplicateKeyError(error)) {
            handleScooterDuplicateError(res, error);
            return;
        }

        if (error?.name === 'ValidationError') {
            const fields = Object.keys(error.errors || {});
            res.status(400).json({
                message: 'Некорректные данные для обновления самоката. Проверьте переданные поля.',
                details: fields.length ? `Проблемные поля: ${fields.join(', ')}` : undefined
            });
            return;
        }

        if (error?.name === 'CastError') {
            res.status(400).json({
                message: 'Некорректный формат идентификатора самоката. Используйте корректный ObjectId.'
            });
            return;
        }

        res.status(500).json({
            message: 'Не удалось обновить самокат из-за ошибки на сервере. Попробуйте позже.'
        });
    }
};

// DELETE /scooters/:id - удалить самокат
export const deleteScooter = async (req: Request, res: Response): Promise<void> => {
    try {
        const scooter = await Scooter.findByIdAndDelete(req.params.id);

        if (!scooter) {
            res.status(404).json({
                message: 'Самокат с указанным идентификатором не найден. Удаление невозможно.'
            });
            return;
        }

        res.status(204).send();
    } catch (error: any) {
        console.error('Ошибка при удалении самоката:', error);

        if (error?.name === 'CastError') {
            res.status(400).json({
                message: 'Некорректный формат идентификатора самоката. Используйте корректный ObjectId.'
            });
            return;
        }

        res.status(500).json({
            message: 'Не удалось удалить самокат из-за ошибки на сервере. Попробуйте позже.'
        });
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
    } catch (error: any) {
        console.error('Ошибка при получении списка самокатов с ссылками (HATEOAS):', error);
        res.status(500).json({
            message: 'Не удалось получить список самокатов. Попробуйте позже.'
        });
    }
};

// Свободный самокат
export const getFreeScooters = async (req: Request, res: Response): Promise<void> => {
    try {
        const freeScooters = await Scooter.find({ status: 'Free', chargeLevel: { $gt: 20 } });
        res.status(200).json(freeScooters);
    } catch (error: any) {
        console.error('Ошибка при получении свободных самокатов:', error);
        res.status(500).json({
            message: 'Не удалось получить список свободных самокатов. Попробуйте позже.'
        });
    }
};

// Начать поездку
export const startRide = async (req: Request, res: Response): Promise<void> => {
    try {
        const { scooterId, driverId } = req.body;

         if (!scooterId || !driverId) {
             res.status(400).json({
                 message: 'Для начала поездки нужно указать идентификаторы самоката и водителя.',
                 details: 'Поля "scooterId" и "driverId" являются обязательными.'
             });
             return;
         }

        const scooter = await Scooter.findById(scooterId);
        const driver = await Driver.findById(driverId);

        if (!scooter || !driver) {
            res.status(404).json({
                message: 'Самокат или водитель с указанными идентификаторами не найдены. Проверьте scooterId и driverId.'
            });
            return;
        }

        if (scooter.status !== 'Free') {
            res.status(400).json({
                message: 'Самокат сейчас недоступен для начала поездки. Выберите другой самокат.'
            });
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
    } catch (error: any) {
        console.error('Ошибка при начале поездки:', error);

        if (error?.name === 'CastError') {
            res.status(400).json({
                message: 'Некорректный формат идентификаторов scooterId или driverId. Используйте корректный ObjectId.'
            });
            return;
        }

        res.status(500).json({
            message: 'Не удалось начать поездку из-за ошибки на сервере. Попробуйте позже.'
        });
    }
};