const Subject = require('../../models/Subject');

/**
 * Get all subjects
 */
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new subject
 */
exports.createSubject = async (req, res) => {
  try {
    const { name, code, icon, description } = req.body;
    const newSubject = new Subject({ name, code, icon, description });
    await newSubject.save();
    res.status(201).json(newSubject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Toggle subject active status
 */
exports.toggleSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    
    subject.isActive = !subject.isActive;
    await subject.save();
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete subject
 */
exports.deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update subject
 */
exports.updateSubject = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, code, description },
      { new: true }
    );
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
