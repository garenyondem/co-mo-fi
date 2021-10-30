import { Schema, Document, Model, model, Types } from 'mongoose';
import { IUser } from './User';
import { IEvent } from './Event';

export interface IEventAttendee extends Document {
    userId: IUser['_id'];
    eventId: IEvent['_id'];
}

export interface IEventAttendeeModel extends Model<IEventAttendee> {
    getAttendanceStates(eventIds: Types.ObjectId[], userId: Types.ObjectId): Promise<IEventAttendee[]>;
    attend(eventId: Types.ObjectId, userId: Types.ObjectId): Promise<IEventAttendee>;
    isQuotaFull(eventId: Types.ObjectId, quota: number): Promise<boolean>;
}

const EventAttendeeSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        eventId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
    },
    { timestamps: true, versionKey: false }
);

class EventAttendeeClass {
    static async getAttendanceStates(eventIds: Types.ObjectId[], userId: Types.ObjectId): Promise<IEventAttendee[]> {
        const query = {
            eventId: {
                $in: eventIds,
            },
            userId,
        };
        const projection = {
            eventId: 1,
        };
        return EventAttendeeModel.find(query, projection);
    }

    static async attend(eventId: Types.ObjectId, userId: Types.ObjectId): Promise<IEventAttendee> {
        const event = new EventAttendeeModel();
        event.userId = userId;
        event.eventId = eventId;
        return event.save();
    }

    static async isQuotaFull(eventId: Types.ObjectId, quota: number): Promise<boolean> {
        const attendeeCount = await EventAttendeeModel.countDocuments({ eventId });
        return attendeeCount == quota || attendeeCount >= quota;
    }
}

EventAttendeeSchema.loadClass(EventAttendeeClass);

export const EventAttendeeModel = model<IEventAttendee>('EventAttendee', EventAttendeeSchema) as IEventAttendeeModel;
