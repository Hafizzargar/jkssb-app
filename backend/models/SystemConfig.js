const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  latestVersion: {
    type: String,
    default: '1.0.0'
  },
  downloadUrl: {
    type: String,
    default: 'https://medx.com/download'
  },
  updateMessage: {
    type: String,
    default: 'A new version of Medx Prep is available!'
  },
  isUpdateMandatory: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
