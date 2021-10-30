import { GenreModel, IGenre } from '../models/Genre';
import { convertToProtoGenre } from '../converters';

class MusicService {
    async getAvailableGenres() {
        const genres = await GenreModel.find().lean<IGenre>();
        return genres.map(convertToProtoGenre);
    }
}

export default new MusicService();
