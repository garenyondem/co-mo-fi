import { Event } from '../types/Event_pb';
import { EventModel, IEvent } from '../models/Event';
import { EventAttendeeModel } from '../models/EventAttendee';
import { convertToProtoEvent, convertToMongoLocation, convertToMongoPhoto } from '../converters';
import CoreServiceError from '../utils/Error';
import { status } from 'grpc';
import { PlaceModel, IPlace } from '../models/Place';
import logger from '../utils/Logger';
import { Types } from 'mongoose';
import { SaveModel } from '../models/Save';
import { LikeModel } from '../models/Like';

class EventService {
    async insertEvent(options: { event: Event.AsObject }) {
        const { event } = options;
        const newEvent = new EventModel();
        newEvent.title = event.title;
        newEvent.startDate = event.startdatetime.toDate();
        newEvent.endDate = event.enddatetime.toDate();
        newEvent.quota = event.quota;
        newEvent.placeId = event.placeid.toObjectId();
        newEvent.photos = event.photosList?.map(convertToMongoPhoto);

        if (event.location) {
            // custom event location
            newEvent.location = convertToMongoLocation(event.location);
        } else {
            // get location from place
            const place = (await PlaceModel.findById(newEvent.placeId, { location: 1 }).lean()) as IPlace;
            if (!place) {
                throw new CoreServiceError({ message: 'Place data does not exist', code: status.NOT_FOUND });
            }
            newEvent.location = place.location;
        }
        try {
            const createdEvent = await newEvent.save();
            return convertToProtoEvent(createdEvent, { liked: false, saved: false }, false);
        } catch (err) {
            logger.error('Error while creating event ', err);
            throw new CoreServiceError({ message: 'Error while creating event', code: status.INTERNAL });
        }
    }

    async getEvent(options: { userId: string; eventId: string }) {
        const userId = options.userId.toObjectId();
        const eventId = options.eventId.toObjectId();

        const [mongoEvent, attendanceStates, saveStates] = await Promise.all([
            EventModel.findById(eventId),
            EventAttendeeModel.getAttendanceStates([eventId], userId),
            SaveModel.getSaveStatesOfEvents([eventId], userId),
        ]);
        const attendanceState = !!attendanceStates?.some((attendanceState) => {
            return attendanceState.eventId.toHexString() === eventId.toHexString();
        });
        if (!mongoEvent) {
            throw new CoreServiceError({ message: 'Event not found', code: status.NOT_FOUND });
        }
        const saved = !!saveStates?.some((save) => {
            return save.eventId.toHexString() === mongoEvent._id.toHexString();
        });
        return convertToProtoEvent(mongoEvent, { liked: false, saved }, attendanceState);
    }

    async attend(options: { userId: string; eventId: string }) {
        // Works as toggle - attend or leave event
        const userId = options.userId.toObjectId();
        const eventId = options.eventId.toObjectId();
        const exists = await EventAttendeeModel.countDocuments({ eventId, userId }).limit(1);
        if (exists) {
            return EventAttendeeModel.findOneAndRemove({ eventId, userId });
        } else {
            const event = (await EventModel.findById(eventId, { quota: 1 }).lean()) as IEvent;
            if (!event.quota) {
                return EventAttendeeModel.attend(eventId, userId);
            }
            const isFull = await EventAttendeeModel.isQuotaFull(eventId, event.quota);
            if (isFull) {
                throw new CoreServiceError({ message: 'Event is full', code: status.RESOURCE_EXHAUSTED });
            }
            return EventAttendeeModel.attend(eventId, userId);
        }
    }

    async increaseLikeCount(options: { contentId: Types.ObjectId }) {
        return EventModel.findByIdAndUpdate(options.contentId, { $inc: { likeCount: 1 } });
    }

    async decreaseLikeCount(options: { contentId: Types.ObjectId }) {
        return EventModel.findByIdAndUpdate(options.contentId, { $inc: { likeCount: -1 } });
    }

    async increaseSaveCount(options: { contentId: Types.ObjectId }) {
        return EventModel.findByIdAndUpdate(options.contentId, { $inc: { saveCount: 1 } });
    }

    async decreaseSaveCount(options: { contentId: Types.ObjectId }) {
        return EventModel.findByIdAndUpdate(options.contentId, { $inc: { saveCount: -1 } });
    }

    async like(options: { userId: Types.ObjectId; contentId: Types.ObjectId }) {
        const like = new LikeModel({
            userId: options.userId,
            eventId: options.contentId,
        });
        return like.save();
    }

    async unlike(options: { userId: Types.ObjectId; contentId: Types.ObjectId }) {
        const query = {
            userId: options.userId,
            eventId: options.contentId,
        };
        return LikeModel.findOneAndRemove(query);
    }

    async save(options: { userId: Types.ObjectId; contentId: Types.ObjectId }) {
        const saveModel = new SaveModel({
            userId: options.userId,
            eventId: options.contentId,
        });
        return saveModel.save();
    }

    async unsave(options: { userId: Types.ObjectId; contentId: Types.ObjectId }) {
        const query = {
            userId: options.userId,
            eventId: options.contentId,
        };
        return SaveModel.findOneAndRemove(query);
    }
}

export default new EventService();
