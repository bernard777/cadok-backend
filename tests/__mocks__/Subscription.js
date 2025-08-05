// Mock pour le modèle Subscription
class MockSubscription {
  constructor(data = {}) {
    Object.assign(this, data);
    this._id = data._id || '507f1f77bcf86cd799439011';
    this.id = this._id;
  }
  
  save() {
    return Promise.resolve(this);
  }
  
  remove() {
    return Promise.resolve(this);
  }
  
  populate(field) {
    return Promise.resolve(this);
  }
  
  static find(query = {}) {
    return {
      populate: () => ({
        exec: () => Promise.resolve([])
      }),
      exec: () => Promise.resolve([])
    };
  }
  
  static findById(id) {
    return {
      populate: () => ({
        exec: () => Promise.resolve(new MockSubscription({ _id: id }))
      }),
      exec: () => Promise.resolve(new MockSubscription({ _id: id }))
    };
  }
  
  static findOne(query = {}) {
    return {
      populate: () => ({
        exec: () => Promise.resolve(new MockSubscription())
      }),
      exec: () => Promise.resolve(new MockSubscription())
    };
  }
  
  static create(data) {
    return Promise.resolve(new MockSubscription(data));
  }
  
  static findByIdAndUpdate(id, update) {
    return Promise.resolve(new MockSubscription({ _id: id, ...update }));
  }
  
  static findByIdAndDelete(id) {
    return Promise.resolve(new MockSubscription({ _id: id }));
  }
  
  static deleteMany(query) {
    return Promise.resolve({ deletedCount: 0 });
  }
  
  static countDocuments(query) {
    return Promise.resolve(0);
  }
  
  static aggregate(pipeline) {
    return Promise.resolve([]);
  }
}

module.exports = MockSubscription;