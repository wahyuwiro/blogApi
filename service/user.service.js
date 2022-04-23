const User = require("../models/user.model");
var mongo = require('../config/mongo');


const saveUser = async ({ profileId, name, dob, experience }) => {
  const count = await User.countDocuments({ profileId });
  console.log('countDocuments =>',count)
  if(count > 0) throw new Error("User with profileId already exists");
  const user = await new User({
    profileId,
    name,
    dob,
    experience,
  }).save();
  return user;
}

function getAge(dateString) {
  var today = new Date();
  var birthDate = new Date(dateString);
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
  }
  return age;
}

const getUser = async ({ profileId }) => {
  const user = await User.findOne({ profileId });
  if(!user) throw new Error("No user not found with given profileId");

  const age = getAge(user.dob);
  const totalExperience = user.experience.reduce((prev, curr) => prev + curr.years, 0);
  return { profileId, name: user.name, age: age, totalExperience }
}

module.exports.saveUser = saveUser;
module.exports.getUser = getUser;