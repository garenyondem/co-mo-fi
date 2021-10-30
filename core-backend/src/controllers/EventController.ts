import { ServerUnaryCall, sendUnaryData, status } from 'grpc';
import {
    NewEventRequest,
    EventDetailsRequest,
    EventDetailsResponse,
    AttendEventRequest,
} from '../types/EventService_pb';
import { Empty } from '../types/Empty_pb';
import logger from '../utils/Logger';
import EventService from '../services/EventService';
import CoreServiceError from '../utils/Error';
import { ITokenData } from '../interfaces';

export interface IEventController {
    newEvent(call: ServerUnaryCall<NewEventRequest & ITokenData>, callback: sendUnaryData<Empty>): Promise<any>;
    eventDetails(
        call: ServerUnaryCall<EventDetailsRequest & ITokenData>,
        callback: sendUnaryData<EventDetailsResponse>
    ): Promise<any>;
    attendEvent(call: ServerUnaryCall<AttendEventRequest & ITokenData>, callback: sendUnaryData<Empty>): Promise<any>;
}
export class EventController implements IEventController {
    async newEvent(call: ServerUnaryCall<NewEventRequest & ITokenData>, callback: sendUnaryData<Empty>): Promise<any> {
        logger.info('New event');
        const res = new Empty();
        const { request } = call;
        const userId = request.userId;

        try {
            const event = request.getEvent();
            if (!event?.getPlaceid()?.length) {
                throw new CoreServiceError({ message: 'Missing event data', code: status.INVALID_ARGUMENT });
            }
            const savedEvent = await EventService.insertEvent({ event: event.toObject() });
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
    async eventDetails(
        call: ServerUnaryCall<EventDetailsRequest & ITokenData>,
        callback: sendUnaryData<EventDetailsResponse>
    ): Promise<any> {
        logger.info('Event details');
        const res = new EventDetailsResponse();
        const { request } = call;
        const userId = request.userId;

        try {
            const eventId = request.getEventid();
            if (!eventId.length) {
                throw new CoreServiceError({ message: 'Missing event id', code: status.INVALID_ARGUMENT });
            }
            const event = await EventService.getEvent({ eventId, userId });
            res.setEvent(event);
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
    async attendEvent(call: ServerUnaryCall<AttendEventRequest & ITokenData>, callback: sendUnaryData<Empty>): Promise<any> {
        logger.info('Attend event - toggle');
        const res = new Empty();
        const { request } = call;
        const userId = request.userId;

        try {
            const eventId = request.getEventid();
            if (!eventId?.length) {
                throw new CoreServiceError({ message: 'Missing event id', code: status.INVALID_ARGUMENT })
            }
            await EventService.attend({ userId, eventId });
            return callback(null, res);
        } catch (err) {
            return callback(err, res);
        }
    }
}
