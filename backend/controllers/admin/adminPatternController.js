const ExamPattern = require('../../models/ExamPattern');

exports.getAllPatterns = async (req, res) => {
  try {
    const patterns = await ExamPattern.find().sort({ createdAt: -1 });
    res.json(patterns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPattern = async (req, res) => {
  try {
    const pattern = new ExamPattern(req.body);
    await pattern.save();
    res.status(201).json(pattern);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updatePattern = async (req, res) => {
  try {
    const pattern = await ExamPattern.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(pattern);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deletePattern = async (req, res) => {
  try {
    await ExamPattern.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pattern deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
