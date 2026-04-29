const SystemConfig = require('../../models/SystemConfig');

exports.getConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({});
    }
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const { latestVersion, downloadUrl, updateMessage, isUpdateMandatory } = req.body;
    let config = await SystemConfig.findOne();
    
    if (config) {
      config.latestVersion = latestVersion || config.latestVersion;
      config.downloadUrl = downloadUrl || config.downloadUrl;
      config.updateMessage = updateMessage || config.updateMessage;
      config.isUpdateMandatory = isUpdateMandatory !== undefined ? isUpdateMandatory : config.isUpdateMandatory;
      await config.save();
    } else {
      config = await SystemConfig.create(req.body);
    }
    
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
