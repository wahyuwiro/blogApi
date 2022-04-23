const User = Mongoose.model('User', Mongoose.Schema({
    profileId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: '', required: true },
    dob: { type: Date, required: true },
    experience: [{ 
      years: { type: Number, default: 0, required: true },
      organizationName: { type: String, required: true }
    }]
  }))