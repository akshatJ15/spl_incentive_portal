import mongoose from 'mongoose';
import User from './User.js';

const QrTokenSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true
  },
  points: {
    type: Number,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  claimedBy: {
    type: String,
    default: null
  },
  claimedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const QrTokenModel = mongoose.models.QrToken || mongoose.model('QrToken', QrTokenSchema);

const isMongoActive = () => {
  const hasUri = !!(process.env.MONGO_URI || process.env.MONGODB_URI);
  const state = mongoose.connection.readyState;
  return hasUri || state === 1 || state === 2;
};

// Memory fallback to support fully functional in-browser previewing when no MongoDB is running
const localMemoryDb = [];

export const QrToken = {
  schema: QrTokenSchema,
  rawModel: QrTokenModel,

  async create(data) {
    if (isMongoActive()) {
      return await QrTokenModel.create(data);
    } else {
      const record = {
        uid: data.uid,
        points: Number(data.points),
        used: data.used ?? false,
        claimedBy: data.claimedBy ?? null,
        claimedAt: data.claimedAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function() {
          const idx = localMemoryDb.findIndex(item => item.uid === this.uid);
          if (idx !== -1) {
            this.updatedAt = new Date();
            localMemoryDb[idx] = { ...this };
          }
          return this;
        }
      };
      localMemoryDb.push(record);
      return record;
    }
  },

  async insertMany(array) {
    if (isMongoActive()) {
      return await QrTokenModel.insertMany(array);
    } else {
      const records = array.map(data => {
        const record = {
          uid: data.uid,
          points: Number(data.points),
          used: data.used ?? false,
          claimedBy: data.claimedBy ?? null,
          claimedAt: data.claimedAt ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          save: async function() {
            const idx = localMemoryDb.findIndex(item => item.uid === this.uid);
            if (idx !== -1) {
              this.updatedAt = new Date();
              localMemoryDb[idx] = { ...this };
            }
            return this;
          }
        };
        localMemoryDb.push(record);
        return record;
      });
      return records;
    }
  },

  async findOne(query) {
    if (isMongoActive()) {
      return await QrTokenModel.findOne(query);
    } else {
      const found = localMemoryDb.find(item => {
        return Object.keys(query).every(key => {
          if (query[key] instanceof RegExp) {
            return query[key].test(item[key]);
          }
          return item[key] === query[key];
        });
      });
      if (found) {
        return {
          ...found,
          save: async function() {
            const idx = localMemoryDb.findIndex(item => item.uid === this.uid);
            if (idx !== -1) {
              this.updatedAt = new Date();
              localMemoryDb[idx] = { ...this };
            }
            return this;
          }
        };
      }
      return null;
    }
  },

  async find(query = {}) {
    if (isMongoActive()) {
      return await QrTokenModel.find(query);
    } else {
      return localMemoryDb.filter(item => {
        return Object.keys(query).every(key => item[key] === query[key]);
      });
    }
  },

  async findOneAndUpdate(query, update, options = {}) {
    if (isMongoActive()) {
      return await QrTokenModel.findOneAndUpdate(query, update, options);
    } else {
      const found = await this.findOne(query);
      if (found) {
        const idx = localMemoryDb.findIndex(item => item.uid === found.uid);
        if (idx !== -1) {
          let updatedFields = {};
          if (update.$set) {
            updatedFields = { ...update.$set };
          } else {
            // Apply all fields from a flat update object directly
            for (const key of Object.keys(update)) {
              if (!key.startsWith('$')) {
                updatedFields[key] = update[key];
              }
            }
          }
          localMemoryDb[idx] = {
            ...localMemoryDb[idx],
            ...updatedFields,
            updatedAt: new Date()
          };
          return {
            ...localMemoryDb[idx],
            save: async function() {
              const currentIdx = localMemoryDb.findIndex(item => item.uid === this.uid);
              if (currentIdx !== -1) {
                this.updatedAt = new Date();
                localMemoryDb[currentIdx] = { ...this };
              }
              return this;
            }
          };
        }
      }
      return null;
    }
  }
};

export default QrToken;
