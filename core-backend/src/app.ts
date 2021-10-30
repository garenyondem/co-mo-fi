import config from './config';
import './extensions/index';
import { default as initMongoConnections, GlobalConns } from './db/Mongo';
import { ServerCredentials } from 'grpc';
import { PlaceController } from './controllers/PlaceController';
import { SpotifyController } from './controllers/SpotifyController';
import { FeedController } from './controllers/FeedController';
import { LocationController } from './controllers/LocationController';
import { PlacesServiceService } from './types/PlacesService_grpc_pb';
import { SpotifyServiceService } from './types/SpotifyService_grpc_pb';
import { FeedServiceService } from './types/FeedService_grpc_pb';
import { LocationServiceService } from './types/LocationService_grpc_pb';
import { CoreGrpcServer } from './utils/Server';
import { AccountServiceService } from './types/AccountService_grpc_pb';
import { AccountController } from './controllers/AccountController';
import { UserServiceService } from './types/UserService_grpc_pb';
import { UserController } from './controllers/UserController';
import { InteractionServiceService } from './types/InteractionService_grpc_pb';
import { InteractionController } from './controllers/InteractionController';
import { InfoServiceService } from './types/InfoService_grpc_pb';
import { InfoController } from './controllers/InfoController';
import { authenticate } from './interceptors/Authentication';
import { rateLimit } from './interceptors/RateLimit';
import { UploadServiceService } from './types/UploadService_grpc_pb';
import { UploadController } from './controllers/UploadController';
import { MusicServiceService } from './types/MusicService_grpc_pb';
import { MusicController } from './controllers/MusicController';

initMongoConnections();

const server = new CoreGrpcServer();

addServices(server);

server.use(rateLimit);
server.use(authenticate);

server.bind(`0.0.0.0:${config.servicePort}`, ServerCredentials.createInsecure());
server.start();

function addServices(server: CoreGrpcServer) {
    server.addService(PlacesServiceService, new PlaceController());
    server.addService(SpotifyServiceService, new SpotifyController());
    server.addService(FeedServiceService, new FeedController());
    server.addService(LocationServiceService, new LocationController());
    server.addService(AccountServiceService, new AccountController());
    server.addService(UserServiceService, new UserController());
    server.addService(InteractionServiceService, new InteractionController());
    server.addService(InfoServiceService, new InfoController());
    server.addService(UploadServiceService, new UploadController());
    server.addService(MusicServiceService, new MusicController());
}

process.on('SIGTERM', disconnect).on('SIGINT', disconnect);

function disconnect() {
    (global as GlobalConns).coreDB.connection.close(() => {
        process.exit(0);
    });
}
